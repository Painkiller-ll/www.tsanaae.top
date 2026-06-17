import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint - returns request info to help diagnose auth/proxy issues.
 * Does NOT require authentication - it just reports what it receives.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || 'none';
    const authHeader = request.headers.get('authorization') || 'none';
    const cookieHeader = request.headers.get('cookie') || 'none';
    const cookieToken = request.cookies.get('admin_token')?.value || 'none';
    
    let bodyInfo: string | Record<string, unknown> = 'empty';
    let bodySize = 0;
    
    try {
      const text = await request.text();
      bodySize = text.length;
      if (contentType.includes('application/json') && text.trim()) {
        const parsed = JSON.parse(text);
        bodyInfo = {
          keys: Object.keys(parsed),
          title: parsed.title || 'N/A',
          resource_type: parsed.resource_type || 'N/A',
          has_download_links: !!(parsed.download_links?.length),
        };
      } else if (contentType.includes('multipart/form-data')) {
        bodyInfo = `FormData, size=${bodySize}`;
      } else {
        bodyInfo = `Content-Type: ${contentType}, size=${bodySize}`;
      }
    } catch (e) {
      bodyInfo = `Parse error: ${e instanceof Error ? e.message : 'unknown'}`;
    }

    return NextResponse.json({
      status: 'ok',
      received: {
        content_type: contentType,
        auth_header: authHeader !== 'none' ? `Bearer ...${authHeader.slice(-8)}` : 'none',
        cookie_header_present: cookieHeader !== 'none',
        cookie_token_present: cookieToken !== 'none',
        body_info: bodyInfo,
        body_size: bodySize,
      },
      env: {
        NODE_ENV: process.env.NODE_ENV || 'undefined',
        ADMIN_PASSWORD_SET: !!process.env.ADMIN_PASSWORD,
        SESSION_SECRET_SET: !!process.env.ADMIN_SESSION_SECRET,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: err instanceof Error ? err.message : 'unknown',
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Admin debug endpoint is working',
    auth_header: request.headers.get('authorization') ? 'present' : 'none',
    cookie_token: request.cookies.get('admin_token')?.value ? 'present' : 'none',
  });
}
