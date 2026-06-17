import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // Security: validate each segment doesn't contain directory traversal
    for (const segment of pathSegments) {
      if (segment.includes('..') || segment.startsWith('/') || segment.startsWith('\\')) {
        return NextResponse.json({ error: '无效路径' }, { status: 400 });
      }
    }

    const relativePath = path.join(...pathSegments);
    const filepath = path.join(process.cwd(), 'public', relativePath);

    // Check file exists
    try {
      const fileStat = await stat(filepath);
      if (!fileStat.isFile()) {
        return NextResponse.json({ error: '文件不存在' }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: '文件不存在' }, { status: 404 });
    }

    const buffer = await readFile(filepath);

    // Determine content type from extension
    const ext = path.extname(filepath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.pdf': 'application/pdf',
    };
    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
