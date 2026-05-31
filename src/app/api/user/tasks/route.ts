import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUserId } from '@/lib/user-auth';

// POST - Award points for an action (comment, rate, share, favorite)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { action, reference_id } = await request.json();

    // Point rewards per action
    const rewards: Record<string, { points: number; reason: string; max_per_day: number }> = {
      comment: { points: 2, reason: '发表评论', max_per_day: 10 },
      rate: { points: 1, reason: '游戏评分', max_per_day: 5 },
      share: { points: 3, reason: '分享游戏', max_per_day: 3 },
      favorite: { points: 1, reason: '收藏游戏', max_per_day: 5 },
    };

    const reward = rewards[action];
    if (!reward) {
      return NextResponse.json({ error: '无效的积分动作' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const { data: todayRecords } = await client
      .from('point_transactions')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', today)
      .like('reason', `%${reward.reason}%`);

    if (todayRecords && todayRecords.length >= reward.max_per_day) {
      return NextResponse.json({
        error: `今日${reward.reason}积分已达上限`,
        daily_limit_reached: true,
      }, { status: 400 });
    }

    // Award points
    const { data: user } = await client
      .from('users')
      .select('points')
      .eq('id', userId)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const newPoints = (user.points || 0) + reward.points;
    await client.from('users').update({ points: newPoints }).eq('id', userId);

    await client.from('point_transactions').insert({
      user_id: userId,
      amount: reward.points,
      balance_after: newPoints,
      reason: reward.reason,
      reference_id: reference_id || null,
    });

    return NextResponse.json({
      success: true,
      points_earned: reward.points,
      total_points: newPoints,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET - Get available tasks and progress
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const client = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // Get today's transactions grouped by reason
    const { data: todayRecords } = await client
      .from('point_transactions')
      .select('reason, amount')
      .eq('user_id', userId)
      .gte('created_at', today)
      .gt('amount', 0);

    const tasks = [
      { id: 'checkin', name: '每日签到', points: 10, max: 1, icon: '📅' },
      { id: 'comment', name: '发表评论', points: 2, max: 10, icon: '💬' },
      { id: 'rate', name: '游戏评分', points: 1, max: 5, icon: '⭐' },
      { id: 'share', name: '分享游戏', points: 3, max: 3, icon: '🔗' },
      { id: 'favorite', name: '收藏游戏', points: 1, max: 5, icon: '🔖' },
    ];

    const reasonMap: Record<string, string> = {
      checkin: '每日签到',
      comment: '发表评论',
      rate: '游戏评分',
      share: '分享游戏',
      favorite: '收藏游戏',
    };

    const progress = tasks.map(task => {
      const reason = reasonMap[task.id] || '';
      const count = (todayRecords || []).filter(
        (r: { reason: string; amount: number }) => r.reason.includes(reason)
      ).length;
      return {
        ...task,
        completed: count,
        remaining: Math.max(0, task.max - count),
      };
    });

    return NextResponse.json({ tasks: progress });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
