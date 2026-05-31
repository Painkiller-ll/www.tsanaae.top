import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function GET() {
  try {
    const isAuth = await isAdminAuthenticated();
    return NextResponse.json({ authenticated: isAuth });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}
