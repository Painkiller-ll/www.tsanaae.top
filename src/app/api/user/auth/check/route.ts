import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/user-auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.profile.nickname,
      avatar_url: user.profile.avatar_url,
      role: user.role,
      points: user.points,
    },
  });
}
