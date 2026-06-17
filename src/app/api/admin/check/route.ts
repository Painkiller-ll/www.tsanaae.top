import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Check cookie first
    const cookieToken = request.cookies.get('admin_token')?.value;
    if (cookieToken && verifyToken(cookieToken)) {
      return NextResponse.json({ authenticated: true });
    }

    // Check Authorization header
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
    if (authHeader && verifyToken(authHeader)) {
      return NextResponse.json({ authenticated: true });
    }

    // Check raw cookie header
    const cookieHeader = request.headers.get('cookie') || '';
    const rawCookieToken = cookieHeader.split('admin_token=')[1]?.split(';')[0];
    if (rawCookieToken && verifyToken(rawCookieToken)) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
