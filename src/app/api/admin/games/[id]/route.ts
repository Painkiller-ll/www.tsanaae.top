import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const client = getSupabaseClient();

    const { data: game, error } = await client
      .from('games')
      .select('*')
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

    return NextResponse.json({ game });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    const { tag_ids, ...gameData } = body;

    // Update game
    const { data: game, error } = await client
      .from('games')
      .update({ ...gameData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update game: ${error.message}`);

    // Update game-tag associations
    if (tag_ids !== undefined) {
      // Delete existing associations
      await client.from('game_tags').delete().eq('game_id', id);

      // Insert new associations
      if (tag_ids.length > 0) {
        const gameTagRecords = tag_ids.map((tag_id: string) => ({
          game_id: id,
          tag_id,
        }));

        const { error: gtError } = await client
          .from('game_tags')
          .insert(gameTagRecords);

        if (gtError) throw new Error(`Failed to update game tags: ${gtError.message}`);
      }
    }

    return NextResponse.json({ game });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuth = await isAdminAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { id } = await params;
    const client = getSupabaseClient();

    // Delete game (cascading will handle game_tags and comments)
    const { error } = await client.from('games').delete().eq('id', id);

    if (error) throw new Error(`Failed to delete game: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
