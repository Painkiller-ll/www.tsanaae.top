import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/collections - 获取合集列表
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    let query = supabase
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true });

    if (!all) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Fetch games for each collection
    const collectionsWithGames = await Promise.all(
      (data || []).map(async (collection) => {
        const { data: cgData } = await supabase
          .from('collection_games')
          .select('game_id, sort_order, games(*)')
          .eq('collection_id', collection.id)
          .order('sort_order', { ascending: true });

        return {
          ...collection,
          games: (cgData || []).map((cg: Record<string, unknown>) => cg.games).filter(Boolean),
        };
      })
    );

    return NextResponse.json({ collections: collectionsWithGames });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch collections';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/collections - 创建合集（管理员）
export async function POST(request: Request) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, cover_image, is_active, sort_order, game_ids } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('collections')
      .insert({
        title,
        description: description || null,
        cover_image: cover_image || null,
        is_active: is_active !== false,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;

    // Add games to collection if provided
    if (game_ids && game_ids.length > 0) {
      const cgInserts = game_ids.map((gid: string, idx: number) => ({
        collection_id: data.id,
        game_id: gid,
        sort_order: idx,
      }));

      const { error: cgError } = await supabase
        .from('collection_games')
        .insert(cgInserts);

      if (cgError) console.error('Failed to add games to collection:', cgError);
    }

    return NextResponse.json({ collection: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
