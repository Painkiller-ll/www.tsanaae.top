import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - Get leaderboard
export async function GET() {
  try {
    const client = getSupabaseClient();

    // Get top users by points
    const { data: users, error } = await client
      .from('users')
      .select('id, points, created_at')
      .order('points', { ascending: false })
      .limit(50);

    if (error) throw new Error(`Failed to fetch leaderboard: ${error.message}`);

    // Get profiles for these users
    const userIds = (users || []).map((u: { id: string }) => u.id);

    const { data: profiles } = await client
      .from('user_profiles')
      .select('user_id, nickname, avatar_url')
      .in('user_id', userIds);

    // Merge
    const profileMap = new Map(
      (profiles || []).map((p: { user_id: string; nickname: string; avatar_url: string }) => [p.user_id, p])
    );

    const leaderboard = (users || []).map((u: { id: string; points: number; created_at: string }, index: number) => {
      const profile = profileMap.get(u.id);
      return {
        rank: index + 1,
        user_id: u.id,
        nickname: profile?.nickname || '匿名玩家',
        avatar_url: profile?.avatar_url || '',
        points: u.points || 0,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
