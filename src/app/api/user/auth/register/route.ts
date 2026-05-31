import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import { hashPassword, generateUserToken, getUserCookieOptions } from '@/lib/user-auth';

export async function POST(request: Request) {
  try {
    const { email, password, nickname, invite_code } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    // Check if email exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate invite code for new user
    const newInviteCode = (await supabase.rpc('gen_random_uuid')).data?.substring(0, 8).toUpperCase() || Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ email, password_hash: passwordHash, role: 'user', points: 50, invite_code: newInviteCode })
      .select('id, email, role, points')
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: '注册失败' }, { status: 500 });
    }

    // Create profile
    await supabase
      .from('user_profiles')
      .insert({ user_id: user.id, nickname: nickname || '玩家' });

    // Award registration points
    await supabase
      .from('point_transactions')
      .insert({
        user_id: user.id,
        amount: 50,
        balance_after: 50,
        reason: '注册奖励',
      });

    // Handle invite code
    let inviteReward = 0;
    if (invite_code) {
      const { data: inviter } = await supabase
        .from('users')
        .select('id, points')
        .eq('invite_code', invite_code)
        .single();

      if (inviter && inviter.id !== user.id) {
        // Award inviter 50 points
        const inviterNewPoints = (inviter.points || 0) + 50;
        await supabase.from('users').update({ points: inviterNewPoints }).eq('id', inviter.id);
        await supabase.from('point_transactions').insert({
          user_id: inviter.id,
          amount: 50,
          balance_after: inviterNewPoints,
          reason: '邀请好友奖励',
        });

        // Award invitee 30 bonus points
        inviteReward = 30;
        const inviteeNewPoints = 50 + inviteReward;
        await supabase.from('users').update({ points: inviteeNewPoints }).eq('id', user.id);
        await supabase.from('point_transactions').insert({
          user_id: user.id,
          amount: inviteReward,
          balance_after: inviteeNewPoints,
          reason: '使用邀请码奖励',
        });

        // Update user's invited_by
        await supabase.from('users').update({ invited_by: inviter.id }).eq('id', user.id);

        // Record invite
        await supabase.from('invite_rewards').insert({
          inviter_id: inviter.id,
          invitee_id: user.id,
          points_awarded: 50,
        });
      }
    }

    // Set cookie
    const token = generateUserToken(user.id);
    const cookieOptions = getUserCookieOptions();
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, nickname: nickname || '玩家', points: 50 + inviteReward },
    });
    response.cookies.set(cookieOptions.name, token, cookieOptions.options);

    return response;
  } catch {
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}
