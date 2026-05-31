import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUserId } from '@/lib/user-auth';

// POST - Unlock a game's premium resources using points
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { game_id } = await request.json();
    if (!game_id) {
      return NextResponse.json({ error: '游戏ID必填' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // Check if already unlocked
    const { data: existingUnlock } = await client
      .from('game_unlocks')
      .select('id')
      .eq('user_id', userId)
      .eq('game_id', game_id)
      .maybeSingle();

    if (existingUnlock) {
      return NextResponse.json({ error: '你已经解锁了该游戏', already_unlocked: true }, { status: 400 });
    }

    // Get game unlock cost
    const { data: game, error: gameError } = await client
      .from('games')
      .select('id, title, unlock_points')
      .eq('id', game_id)
      .maybeSingle();

    if (gameError || !game) {
      return NextResponse.json({ error: '游戏不存在' }, { status: 404 });
    }

    const cost = game.unlock_points || 0;
    if (cost <= 0) {
      return NextResponse.json({ error: '该游戏无需解锁' }, { status: 400 });
    }

    // Check user points
    const { data: user } = await client
      .from('users')
      .select('points')
      .eq('id', userId)
      .maybeSingle();

    if (!user || user.points < cost) {
      return NextResponse.json({ error: `积分不足，需要 ${cost} 积分` }, { status: 400 });
    }

    // Deduct points
    const newPoints = user.points - cost;
    await client.from('users').update({ points: newPoints }).eq('id', userId);

    // Record transaction
    await client.from('point_transactions').insert({
      user_id: userId,
      amount: -cost,
      balance_after: newPoints,
      reason: `解锁资源: ${game.title}`,
      reference_id: game_id,
    });

    // Create unlock record
    await client.from('game_unlocks').insert({
      user_id: userId,
      game_id,
      points_cost: cost,
    });

    return NextResponse.json({
      success: true,
      points_remaining: newPoints,
      game_title: game.title,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET - Check if user has unlocked a game
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ unlocked_games: [] }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('game_id');

    const client = getSupabaseClient();

    if (gameId) {
      const { data } = await client
        .from('game_unlocks')
        .select('id')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .maybeSingle();
      return NextResponse.json({ unlocked: !!data });
    }

    // Get all unlocked games
    const { data, error } = await client
      .from('game_unlocks')
      .select('game_id, points_cost, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch unlocks: ${error.message}`);

    return NextResponse.json({ unlocked_games: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
