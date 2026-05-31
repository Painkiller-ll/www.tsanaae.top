import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const tag = searchParams.get('tag');

    const client = getSupabaseClient();

    let gameIds: string[] | null = null;

    // If searching by tag, get game IDs first
    if (tag) {
      const { data: tagData, error: tagError } = await client
        .from('tags')
        .select('id')
        .eq('name', tag)
        .maybeSingle();

      if (tagError) throw new Error(`Tag query failed: ${tagError.message}`);

      if (tagData) {
        const { data: gameTagData, error: gtError } = await client
          .from('game_tags')
          .select('game_id')
          .eq('tag_id', tagData.id);

        if (gtError) throw new Error(`Game tag query failed: ${gtError.message}`);
        gameIds = gameTagData?.map((gt: { game_id: string }) => gt.game_id) || [];
      } else {
        return NextResponse.json({ games: [], total: 0 });
      }
    }

    let query = client
      .from('games')
      .select('id, title, cover_image, category_id, platform, likes, is_featured, created_at, categories(id, name, slug)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (q) {
      query = query.ilike('title', `%${q}%`);
    }

    if (gameIds !== null) {
      if (gameIds.length === 0) {
        return NextResponse.json({ games: [], total: 0 });
      }
      query = query.in('id', gameIds);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Search failed: ${error.message}`);

    // Get tags for results
    const games = data || [];
    if (games.length > 0) {
      const ids = games.map((g: { id: string }) => g.id);
      const { data: gameTagsData } = await client
        .from('game_tags')
        .select('game_id, tags(id, name)')
        .in('game_id', ids);

      const tagMap = new Map<string, { id: string; name: string }[]>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (gameTagsData as any[])?.forEach((gt: any) => {
        const gameId: string = gt.game_id;
        const tagData = gt.tags;
        if (!tagMap.has(gameId)) {
          tagMap.set(gameId, []);
        }
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

    return NextResponse.json({ games, total: games.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
