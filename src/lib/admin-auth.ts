import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_TOKEN = process.env.ADMIN_SESSION_SECRET || 'tsanaae-secret-key-2025';

// Simple token generation
function generateToken(): string {
  const payload = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
  const token = Buffer.from(`${SESSION_TOKEN}:${payload}`).toString('base64');
  return token;
}

// Verify token
export function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    return decoded.startsWith(`${SESSION_TOKEN}:`);
  } catch {
    return false;
  }
}

// Check if admin is authenticated
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return false;
  return verifyToken(token);
}

// Login
export function authenticateAdmin(password: string): string | null {
  if (password === ADMIN_PASSWORD) {
    return generateToken();
  }
  return null;
}

// Get admin token cookie options
export function getAdminCookieOptions() {
  return {
    name: 'admin_token' as const,
    options: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}
