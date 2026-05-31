import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('comments')
      .select('*')
      .eq('game_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(`Failed to fetch comments: ${error.message}`);

    return NextResponse.json({ comments: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nickname, avatar, content } = body;

    if (!nickname || !content) {
      return NextResponse.json(
        { error: 'Nickname and content are required' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();

    const { data, error } = await client
      .from('comments')
      .insert({
        game_id: id,
        nickname,
        avatar: avatar || null,
        content,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create comment: ${error.message}`);

    return NextResponse.json({ comment: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
