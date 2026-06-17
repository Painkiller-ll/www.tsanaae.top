import { NextResponse } from 'next/server';
import { authenticateAdmin, getAdminCookieOptions } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: '请输入密码' }, { status: 400 });
    }

    const token = authenticateAdmin(password);
    if (!token) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const cookieOpts = getAdminCookieOptions();
    const response = NextResponse.json({ success: true, token });
    response.cookies.set(cookieOpts.name, token, cookieOpts.options);

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieOpts = getAdminCookieOptions();
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieOpts.name, '', { ...cookieOpts.options, maxAge: 0 });
  return response;
}
