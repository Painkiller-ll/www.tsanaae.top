import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - Get user's rating for a game
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    // Get game's avg rating and count
    const { data: game, error: gameError } = await client
      .from('games')
      .select('avg_rating, rating_count')
      .eq('id', id)
      .maybeSingle();

    if (gameError) throw new Error(`Failed to fetch game: ${gameError.message}`);

    return NextResponse.json({
      avg_rating: game?.avg_rating || 0,
      rating_count: game?.rating_count || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Submit or update a rating
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, user_token } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (!user_token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user token
    const client = getSupabaseClient();
    const { data: userData, error: userError } = await client
      .from('users')
      .select('id')
      .eq('id', user_token)
      .maybeSingle();

    if (userError || !userData) {
      return NextResponse.json({ error: 'Invalid user token' }, { status: 401 });
    }

    const userId = userData.id;

    // Check if user already rated
    const { data: existingRating } = await client
      .from('game_ratings')
      .select('id, rating')
      .eq('user_id', userId)
      .eq('game_id', id)
      .maybeSingle();

    if (existingRating) {
      // Update existing rating
      const { error: updateError } = await client
        .from('game_ratings')
        .update({ rating })
        .eq('id', existingRating.id);

      if (updateError) throw new Error(`Failed to update rating: ${updateError.message}`);
    } else {
      // Insert new rating
      const { error: insertError } = await client
        .from('game_ratings')
        .insert({ user_id: userId, game_id: id, rating });

      if (insertError) throw new Error(`Failed to create rating: ${insertError.message}`);
    }

    // Recalculate average rating
    const { data: allRatings } = await client
      .from('game_ratings')
      .select('rating')
      .eq('game_id', id);

    const ratingCount = allRatings?.length || 0;
    const avgRating = ratingCount > 0
      ? allRatings!.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratingCount
      : 0;

    // Update game with new average
    const { error: gameUpdateError } = await client
      .from('games')
      .update({
        avg_rating: Math.round(avgRating * 10) / 10,
        rating_count: ratingCount,
      })
      .eq('id', id);

    if (gameUpdateError) throw new Error(`Failed to update game rating: ${gameUpdateError.message}`);

    // Award points for first-time rating (1 point, max 3 per day)
    if (!existingRating) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data: todayRatings } = await client
          .from('point_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('reason', '评分奖励')
          .gte('created_at', today)
          .limit(3);

        if (todayRatings && todayRatings.length < 3) {
          const { data: userPointData } = await client
            .from('users')
            .select('points')
            .eq('id', userId)
            .single();

          if (userPointData) {
            const newPoints = (userPointData.points || 0) + 1;
            await client.from('users').update({ points: newPoints }).eq('id', userId);
            await client.from('point_transactions').insert({
              user_id: userId,
              amount: 1,
              balance_after: newPoints,
              reason: '评分奖励',
            });
          }
        }
      } catch {
        // Points award is optional
      }
    }

    return NextResponse.json({
      rating,
      avg_rating: Math.round(avgRating * 10) / 10,
      rating_count: ratingCount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
