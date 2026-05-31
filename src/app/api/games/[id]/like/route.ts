import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    // Get current likes
    const { data: game, error: fetchError } = await client
      .from('games')
      .select('likes')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw new Error(`Failed to fetch game: ${fetchError.message}`);
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    const { data, error } = await client
      .from('games')
      .update({ likes: game.likes + 1 })
      .eq('id', id)
      .select('likes')
      .single();

    if (error) throw new Error(`Failed to update likes: ${error.message}`);

    return NextResponse.json({ likes: data.likes });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
