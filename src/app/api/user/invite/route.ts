import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getCurrentUserId } from '@/lib/user-auth';

// POST - Use invite code during registration or after
export async function POST(request: Request) {
  try {
    const { invite_code } = await request.json();
    if (!invite_code) {
      return NextResponse.json({ error: '请输入邀请码' }, { status: 400 });
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const client = getSupabaseClient();

    // Check if user already used an invite code
    const { data: user } = await client
      .from('users')
      .select('invited_by')
      .eq('id', userId)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    if (user.invited_by) {
      return NextResponse.json({ error: '你已经使用过邀请码了' }, { status: 400 });
    }

    // Find inviter by code
    const { data: inviter, error: inviterError } = await client
      .from('users')
      .select('id, nickname, points')
      .eq('invite_code', invite_code.toUpperCase())
      .maybeSingle();

    if (inviterError || !inviter) {
      return NextResponse.json({ error: '邀请码无效' }, { status: 400 });
    }

    if (inviter.id === userId) {
      return NextResponse.json({ error: '不能使用自己的邀请码' }, { status: 400 });
    }

    // Check if already rewarded
    const { data: existingReward } = await client
      .from('invite_rewards')
      .select('id')
      .eq('invitee_id', userId)
      .maybeSingle();

    if (existingReward) {
      return NextResponse.json({ error: '你已经领取过邀请奖励了' }, { status: 400 });
    }

    const INVITER_REWARD = 50;
    const INVITEE_REWARD = 30;

    // Reward inviter
    const inviterNewPoints = (inviter.points || 0) + INVITER_REWARD;
    await client.from('users').update({ points: inviterNewPoints }).eq('id', inviter.id);
    await client.from('point_transactions').insert({
      user_id: inviter.id,
      amount: INVITER_REWARD,
      balance_after: inviterNewPoints,
      reason: `邀请好友奖励`,
      reference_id: userId,
    });

    // Reward invitee
    const { data: currentUser } = await client
      .from('users')
      .select('points')
      .eq('id', userId)
      .maybeSingle();

    const inviteeNewPoints = (currentUser?.points || 0) + INVITEE_REWARD;
    await client.from('users').update({
      points: inviteeNewPoints,
      invited_by: inviter.id,
    }).eq('id', userId);
    await client.from('point_transactions').insert({
      user_id: userId,
      amount: INVITEE_REWARD,
      balance_after: inviteeNewPoints,
      reason: `使用邀请码奖励`,
      reference_id: inviter.id,
    });

    // Record invite
    await client.from('invite_rewards').insert({
      inviter_id: inviter.id,
      invitee_id: userId,
      points_awarded: INVITER_REWARD,
    });

    return NextResponse.json({
      success: true,
      inviter_reward: INVITER_REWARD,
      invitee_reward: INVITEE_REWARD,
      inviter_name: inviter.nickname,
      new_points: inviteeNewPoints,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET - Get user's invite code and stats
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const client = getSupabaseClient();

    const { data: user } = await client
      .from('users')
      .select('invite_code')
      .eq('id', userId)
      .maybeSingle();

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    // Count invites
    const { count } = await client
      .from('invite_rewards')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_id', userId);

    return NextResponse.json({
      invite_code: user.invite_code,
      invite_count: count || 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
