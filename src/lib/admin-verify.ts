import { NextRequest, NextResponse } from 'next/server';

/**
 * Verify admin request from cookie (httpOnly admin_token) or Authorization header
 */
async function verifyAdminRequest(request: Request): Promise<NextResponse | null> {
  const { verifyToken } = await import('@/lib/admin-auth');
  
  // Try cookie via NextRequest
  try {
    const nextReq = request as NextRequest;
    const cookieToken = nextReq.cookies.get('admin_token')?.value;
    if (cookieToken && verifyToken(cookieToken)) return null;
  } catch {}
  
  // Fallback: Try Authorization header
  const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
  if (authHeader && verifyToken(authHeader)) return null;
  
  // Also check raw cookie header
  const cookieHeader = request.headers.get('cookie') || '';
  const rawCookieToken = cookieHeader.split('admin_token=')[1]?.split(';')[0];
  if (rawCookieToken && verifyToken(rawCookieToken)) return null;
  
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export default verifyAdminRequest;
