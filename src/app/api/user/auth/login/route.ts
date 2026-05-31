import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import { verifyPassword, generateUserToken, getUserCookieOptions } from '@/lib/user-auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '邮箱和密码不能为空' }, { status: 400 });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, status, points, password_hash')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    if (user.status === 'disabled') {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 403 });
    }

    // Verify password
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // Get profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('nickname, avatar_url')
      .eq('user_id', user.id)
      .single();

    // Set cookie
    const token = generateUserToken(user.id);
    const cookieOptions = getUserCookieOptions();
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nickname: profile?.nickname || '玩家',
        avatar_url: profile?.avatar_url || '',
        role: user.role,
        points: user.points,
      },
    });
    response.cookies.set(cookieOptions.name, token, cookieOptions.options);

    return response;
  } catch {
    return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 });
  }
}
