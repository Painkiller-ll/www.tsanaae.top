import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const platform = searchParams.get('platform');
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const client = getSupabaseClient();

    let query = client
      .from('games')
      .select('id, title, cover_image, category_id, platform, likes, is_featured, avg_rating, created_at, categories(id, name, slug)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category_id', category);
    }

    if (platform) {
      query = query.eq('platform', platform);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (tag) {
      // First get game IDs for this tag
      const { data: gameTagData, error: tagError } = await client
        .from('game_tags')
        .select('game_id')
        .eq('tag_id', tag);

      if (tagError) throw new Error(`Tag query failed: ${tagError.message}`);

      const gameIds = gameTagData?.map((gt: { game_id: string }) => gt.game_id) || [];
      if (gameIds.length === 0) {
        return NextResponse.json({ games: [], total: 0 });
      }
      query = query.in('id', gameIds);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch games: ${error.message}`);

    // Get total count
    let countQuery = client
      .from('games')
      .select('*', { count: 'exact', head: true });

    if (category) {
      countQuery = countQuery.eq('category_id', category);
    }
    if (platform) {
      countQuery = countQuery.eq('platform', platform);
    }

    const { count } = await countQuery;

    // Get tags for each game
    const games = data || [];
    if (games.length > 0) {
      const gameIds = games.map((g: { id: string }) => g.id);
      const { data: gameTagsData, error: gtError } = await client
        .from('game_tags')
        .select('game_id, tags(id, name)')
        .in('game_id', gameIds);

      if (gtError) throw new Error(`Failed to fetch game tags: ${gtError.message}`);

      const tagMap = new Map<string, { id: string; name: string }[]>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameTagsData as any[])?.forEach((gt: any) => {
        const gameId: string = gt.game_id;
        const tagData = gt.tags;
        if (!tagMap.has(gameId)) {
          tagMap.set(gameId, []);
        }
        // tags from join may be a single object or array
        const tagsArray = Array.isArray(tagData) ? tagData : tagData ? [tagData] : [];
        tagsArray.forEach((t: { id: string; name: string }) => {
          tagMap.get(gameId)!.push(t);
        });
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (games as any[]).forEach((game: any) => {
        game.tags = tagMap.get(game.id as string) || [];
      });
    }

    return NextResponse.json({ games, total: count || 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
