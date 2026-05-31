import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('games')
      .select('id, title, slug, cover_image, category_id, platform, likes, is_featured, created_at, categories(id, name, slug)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch games: ${error.message}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const games = (data || []).map((game: any) => {
      const cat = game.categories;
      return {
        ...game,
        categories: Array.isArray(cat) ? cat[0] : cat,
      };
    });

    return NextResponse.json({ games });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const client = getSupabaseClient();

    const { tag_ids, ...gameData } = body;

    const { data: game, error } = await client
      .from('games')
      .insert(gameData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create game: ${error.message}`);

    // Insert game-tag associations
    if (tag_ids && tag_ids.length > 0 && game) {
      const gameTagRecords = tag_ids.map((tag_id: string) => ({
        game_id: game.id,
        tag_id,
      }));

      const { error: gtError } = await client
        .from('game_tags')
        .insert(gameTagRecords);

      if (gtError) throw new Error(`Failed to create game tags: ${gtError.message}`);
    }

    return NextResponse.json({ game }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
