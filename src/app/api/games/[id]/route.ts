import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    const { data: game, error } = await client
      .from('games')
      .select('*, categories(id, name, slug)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch game: ${error.message}`);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Get tags
    const { data: gameTagsData, error: gtError } = await client
      .from('game_tags')
      .select('tags(id, name)')
      .eq('game_id', id);

    if (gtError) throw new Error(`Failed to fetch tags: ${gtError.message}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    game.tags = (gameTagsData as any[])?.map((gt: any) => {
      const tagData = gt.tags;
      return Array.isArray(tagData) ? tagData[0] : tagData;
    }).filter(Boolean) || [];

    // Get comments
    const { data: comments, error: cError } = await client
      .from('comments')
      .select('*')
      .eq('game_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (cError) throw new Error(`Failed to fetch comments: ${cError.message}`);
    game.comments = comments || [];

    // Get related games (same category, exclude current)
    const { data: relatedGames, error: rgError } = await client
      .from('games')
      .select('id, title, cover_image, platform, likes')
      .eq('category_id', game.category_id)
      .neq('id', id)
      .limit(6);

    if (rgError) throw new Error(`Failed to fetch related games: ${rgError.message}`);
    game.related_games = relatedGames || [];

    return NextResponse.json({ game });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
