import { NextResponse } from 'next/server';
import { getUserCookieOptions } from '@/lib/user-auth';

export async function POST() {
  const cookieOptions = getUserCookieOptions();
  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieOptions.name, '', { ...cookieOptions.options, maxAge: 0 });
  return response;
}
