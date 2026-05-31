import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/user/share - 记录分享行为并奖励积分
export async function POST(request: Request) {
  try {
    const { verifyUserToken } = await import('@/lib/user-auth');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = await verifyUserToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的登录状态' }, { status: 401 });
    }

    const { game_id, platform } = await request.json();
    if (!game_id || !platform) {
      return NextResponse.json({ error: '参数不完整' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 检查今天是否已分享过该游戏（每个游戏每天只奖励一次）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingShare } = await supabase
      .from('share_records')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', game_id)
      .gte('created_at', today.toISOString())
      .limit(1);

    // 即使已分享过也记录，但不给积分
    await supabase.from('share_records').insert({
      user_id: userId,
      game_id,
      platform,
    });

    const alreadyRewarded = existingShare && existingShare.length > 0;

    if (!alreadyRewarded) {
      // 检查每日分享积分上限（每天最多3次）
      const { data: todayShares } = await supabase
        .from('share_records')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

      const shareCount = todayShares?.length || 0;

      if (shareCount <= 3) {
        // 奖励3积分
        const { data: userData } = await supabase
          .from('users')
          .select('points')
          .eq('id', userId)
          .single();

        if (userData) {
          await supabase
            .from('users')
            .update({ points: (userData.points || 0) + 3 })
            .eq('id', userId);

          // 记录积分流水
          await supabase.from('point_transactions').insert({
            user_id: userId,
            amount: 3,
            type: 'earn',
            reason: `分享游戏到${platform}`,
          });
        }

        return NextResponse.json({ success: true, points_earned: 3, message: '分享成功，获得3积分!' });
      }

      return NextResponse.json({ success: true, points_earned: 0, message: '今日分享奖励已达上限' });
    }

    return NextResponse.json({ success: true, points_earned: 0, message: '今日已分享过该游戏' });
  } catch (err) {
    const message = err instanceof Error ? err.message : '分享失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
