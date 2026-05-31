import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

const USER_SESSION_SECRET = process.env.USER_SESSION_SECRET || 'tsanaae-user-secret-2025';

// Generate user session token
export function generateUserToken(userId: string): string {
  const payload = `${userId}:${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const token = Buffer.from(`${USER_SESSION_SECRET}:${payload}`).toString('base64');
  return token;
}

// Verify user session token and extract user ID
export function verifyUserToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    if (!decoded.startsWith(`${USER_SESSION_SECRET}:`)) return null;
    const payload = decoded.substring(USER_SESSION_SECRET.length + 1);
    const userId = payload.split(':')[0];
    return userId || null;
  } catch {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Get current user ID from cookie
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('user_token')?.value;
  if (!token) return null;
  return verifyUserToken(token);
}

// Get current user
export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, status, points, created_at')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  // Get profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('nickname, avatar_url, bio')
    .eq('user_id', userId)
    .single();

  return {
    ...data,
    profile: profile || { nickname: '玩家', avatar_url: '', bio: '' },
  };
}

// User token cookie options
export function getUserCookieOptions() {
  return {
    name: 'user_token' as const,
    options: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    },
  };
}
