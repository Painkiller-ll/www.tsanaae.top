import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import { hashPassword, generateUserToken, getUserCookieOptions } from '@/lib/user-auth';

export async function POST(request: Request) {
  try {
    const { email, password, nickname } = await request.json();

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

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ email, password_hash: passwordHash, role: 'user', points: 0 })
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
      .from('users')
      .update({ points: 50 })
      .eq('id', user.id);

    await supabase
      .from('point_transactions')
      .insert({
        user_id: user.id,
        amount: 50,
        balance_after: 50,
        reason: '注册奖励',
      });

    // Set cookie
    const token = generateUserToken(user.id);
    const cookieOptions = getUserCookieOptions();
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, nickname: nickname || '玩家', points: 50 },
    });
    response.cookies.set(cookieOptions.name, token, cookieOptions.options);

    return response;
  } catch {
    return NextResponse.json({ error: '注册失败，请重试' }, { status: 500 });
  }
}
