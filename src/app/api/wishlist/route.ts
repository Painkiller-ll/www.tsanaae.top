import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyUserToken } from '@/lib/user-auth';

// GET 心愿单列表
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('wishlist')
      .select('*')
      .order('vote_count', { ascending: false })
      .limit(limit);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 如果用户已登录，检查是否已投票
    const token = request.cookies.get('user_token')?.value;
    let userId: string | null = null;
    if (token) {
      userId = await verifyUserToken(token);
    }

    let wishlist = data || [];
    if (userId && wishlist.length > 0) {
      const ids = wishlist.map((w: { id: string }) => w.id);
      const { data: votes } = await supabase
        .from('wishlist_votes')
        .select('wishlist_id')
        .eq('user_id', userId)
        .in('wishlist_id', ids);
      const votedIds = new Set((votes || []).map((v: { wishlist_id: string }) => v.wishlist_id));
      wishlist = wishlist.map((w: { id: string; [key: string]: unknown }) => ({
        ...w,
        has_voted: votedIds.has(w.id),
      }));
    }

    return NextResponse.json({ wishlist });
  } catch (err) {
    console.error('获取心愿单失败:', err);
    return NextResponse.json({ error: '获取心愿单失败' }, { status: 500 });
  }
}

// POST 提交心愿 / 投票
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    const userId = await verifyUserToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效的用户凭证' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabaseClient();

    if (body.action === 'vote') {
      // 投票
      const { wishlist_id } = body;
      if (!wishlist_id) {
        return NextResponse.json({ error: '缺少心愿ID' }, { status: 400 });
      }

      // 检查是否已投票
      const { data: existing } = await supabase
        .from('wishlist_votes')
        .select('id')
        .eq('wishlist_id', wishlist_id)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // 取消投票
        await supabase.from('wishlist_votes').delete().eq('id', existing.id);
        const { data: item } = await supabase
          .from('wishlist')
          .select('vote_count')
          .eq('id', wishlist_id)
          .single();
        if (item) {
          await supabase
            .from('wishlist')
            .update({ vote_count: Math.max(0, item.vote_count - 1) })
            .eq('id', wishlist_id);
        }
        return NextResponse.json({ success: true, voted: false });
      }

      // 新增投票
      const { error } = await supabase
        .from('wishlist_votes')
        .insert({ wishlist_id, user_id: userId });
      if (error) throw error;

      const { data: item } = await supabase
        .from('wishlist')
        .select('vote_count')
        .eq('id', wishlist_id)
        .single();
      if (item) {
        await supabase
          .from('wishlist')
          .update({ vote_count: item.vote_count + 1 })
          .eq('id', wishlist_id);
      }
      return NextResponse.json({ success: true, voted: true });
    }

    // 提交新心愿
    const { title, description } = body;
    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: '请填写游戏名称' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        title: title.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;

    // 提交者自动投一票
    await supabase.from('wishlist_votes').insert({ wishlist_id: data.id, user_id: userId });
    await supabase
      .from('wishlist')
      .update({ vote_count: 1 })
      .eq('id', data.id);

    // 奖励积分（简单方式：直接更新用户积分）
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('points')
        .eq('id', userId)
        .single();
      if (userData) {
        const newPoints = (userData.points || 0) + 5;
        await supabase.from('users').update({ points: newPoints }).eq('id', userId);
        await supabase.from('point_transactions').insert({
          user_id: userId,
          amount: 5,
          balance_after: newPoints,
          reason: '提交心愿单',
        });
      }
    } catch {
      // 积分奖励可选
    }

    return NextResponse.json({ wishlist: data });
  } catch (err) {
    console.error('提交心愿失败:', err);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
