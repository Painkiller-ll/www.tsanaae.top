import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    // 获取资源详情
    const { data: resource, error } = await supabase
      .from('resources')
      .select('*, category:resource_categories(id, name, slug)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!resource) return NextResponse.json({ error: '资源不存在' }, { status: 404 });

    // 增加浏览量
    await supabase.from('resources').update({ view_count: resource.view_count + 1 }).eq('id', id);

    // 获取下载链接
    const { data: downloads } = await supabase
      .from('resource_downloads')
      .select('*')
      .eq('resource_id', id)
      .order('sort_order');

    // 获取用户相关状态
    const session = request.headers.get('x-session');
    let userRating = null;
    let isFavorited = false;
    let isUnlocked = false;

    if (session) {
      const { data: ratingData } = await supabase
        .from('ratings')
        .select('score')
        .eq('resource_id', id)
        .eq('user_id', session)
        .single();
      userRating = ratingData?.score || null;

      const { data: favData } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('resource_id', id)
        .eq('user_id', session)
        .single();
      isFavorited = !!favData;

      const { data: unlockData } = await supabase
        .from('resource_unlocks')
        .select('id')
        .eq('resource_id', id)
        .eq('user_id', session)
        .single();
      isUnlocked = !!unlockData;
    }

    return NextResponse.json({
      data: {
        ...resource,
        view_count: resource.view_count + 1,
        download_links: downloads || [],
        user_rating: userRating,
        is_favorited: isFavorited,
        is_unlocked: isUnlocked,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
