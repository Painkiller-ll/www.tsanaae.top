import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category_id = searchParams.get('category_id');
    const featured = searchParams.get('featured') === 'true';
    const tag = searchParams.get('tag');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'newest';

    const supabase = getSupabaseClient();

    let query = supabase
      .from('resources')
      .select('*, category:resource_categories(id, name, slug)', { count: 'exact' })
      .eq('is_published', true);

    if (type && type !== 'all') query = query.eq('resource_type', type);
    if (category_id) query = query.eq('category_id', category_id);
    if (featured) query = query.eq('is_featured', true);
    if (tag) query = query.contains('tags', [tag]);

    // 排序
    if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (sort === 'popular') query = query.order('view_count', { ascending: false });
    else if (sort === 'rating') query = query.order('avg_rating', { ascending: false });
    else if (sort === 'likes') query = query.order('like_count', { ascending: false });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, total: count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
