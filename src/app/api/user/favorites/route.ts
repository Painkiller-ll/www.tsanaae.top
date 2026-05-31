import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyUserToken } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = verifyUserToken(token);
    if (!userId) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const { game_id } = await request.json();
    if (!game_id) {
      return NextResponse.json({ error: '缺少游戏ID' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 检查是否已收藏
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', game_id)
      .single();

    if (existing) {
      // 已收藏则取消
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('game_id', game_id);

      if (error) throw error;
      return NextResponse.json({ favorited: false, message: '已取消收藏' });
    } else {
      // 未收藏则添加
      const { error } = await supabase
        .from('user_favorites')
        .insert({ user_id: userId, game_id });

      if (error) throw error;
      return NextResponse.json({ favorited: true, message: '收藏成功' });
    }
  } catch (err) {
    console.error('收藏操作失败:', err);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = verifyUserToken(token);
    if (!userId) {
      return NextResponse.json({ error: '登录已过期' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const game_id = searchParams.get('game_id');

    const supabase = getSupabaseClient();

    if (game_id) {
      // 检查单个游戏是否已收藏
      const { data } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('game_id', game_id)
        .single();

      return NextResponse.json({ favorited: !!data });
    }

    // 获取用户收藏列表
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id, game_id, created_at, games(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (err) {
    console.error('获取收藏列表失败:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
