import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyUserToken } from '@/lib/user-auth';

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
    const { nickname, avatar, content, user_token } = body;

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

    // Award points for commenting (2 points, max 3 per day)
    if (user_token) {
      try {
        const userId = await verifyUserToken(user_token);
        if (userId) {
          const today = new Date().toISOString().split('T')[0];
          const { data: todayComments } = await client
            .from('point_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('reason', '评论奖励')
            .gte('created_at', today)
            .limit(3);

          if (todayComments && todayComments.length < 3) {
            const { data: userData } = await client
              .from('users')
              .select('points')
              .eq('id', userId)
              .single();

            if (userData) {
              const newPoints = (userData.points || 0) + 2;
              await client.from('users').update({ points: newPoints }).eq('id', userId);
              await client.from('point_transactions').insert({
                user_id: userId,
                amount: 2,
                balance_after: newPoints,
                reason: '评论奖励',
              });
            }
          }
        }
      } catch {
        // Points award is optional, don't fail the comment
      }
    }

    return NextResponse.json({ comment: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
