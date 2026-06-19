import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// POST /api/upload-cover - 公开图片上传（用户投稿用，无需管理员权限）
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '请选择文件' }, { status: 400 });
    }

    // 仅允许图片格式
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '仅支持 JPG/PNG/GIF/WebP 格式' }, { status: 400 });
    }

    // 限制 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: '图片大小不能超过5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 生成唯一文件名
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

    // 存到 public/uploads/covers 目录
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
    await mkdir(uploadDir, { recursive: true });

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    const url = `/api/files/uploads/covers/${filename}`;

    return NextResponse.json({ url, filename });
  } catch (error) {
    console.error('Cover upload error:', error);
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 });
  }
}
