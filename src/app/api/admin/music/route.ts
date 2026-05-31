import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const MUSIC_DIR = path.join(process.cwd(), 'public', 'music');

// 确保音乐目录存在
async function ensureMusicDir() {
  if (!existsSync(MUSIC_DIR)) {
    await mkdir(MUSIC_DIR, { recursive: true });
  }
}

// GET: 获取所有曲目（管理员，含未启用的）
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ tracks: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取曲目列表失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: 上传新曲目
export async function POST(request: NextRequest) {
  try {
    await ensureMusicDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string | null;
    const coverImage = formData.get('cover_image') as string | null;

    if (!file) {
      return NextResponse.json({ error: '请选择音乐文件' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: '请输入曲目标题' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/x-m4a'];
    const allowedExts = ['.mp3', '.wav', '.ogg', '.flac', '.m4a'];
    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExts.includes(ext) && !allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '不支持的音乐格式，请上传 MP3/WAV/OGG/FLAC 文件' }, { status: 400 });
    }

    // 限制文件大小（50MB）
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: '文件大小不能超过50MB' }, { status: 400 });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}-${safeName}`;
    const filePath = path.join(MUSIC_DIR, fileName);

    // 保存文件到 public/music/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 文件的访问路径
    const fileKey = `/music/${fileName}`;

    // 获取最大 sort_order
    const supabase = getSupabaseClient();
    const { data: maxSort } = await supabase
      .from('music_tracks')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const sortOrder = maxSort && maxSort.length > 0 ? (maxSort[0] as { sort_order: number }).sort_order + 1 : 0;

    // 写入数据库
    const { data, error } = await supabase
      .from('music_tracks')
      .insert({
        title,
        artist: artist || null,
        cover_image: coverImage || null,
        file_key: fileKey,
        sort_order: sortOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      // 如果数据库写入失败，删除已上传的文件
      try {
        const { unlink } = await import('fs/promises');
        await unlink(filePath);
      } catch { /* ignore */ }
      throw error;
    }

    return NextResponse.json({ track: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '上传失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: 更新曲目
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, artist, cover_image, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少曲目ID' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (artist !== undefined) updateData.artist = artist;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('music_tracks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ track: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE: 删除曲目
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少曲目ID' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 先获取文件key
    const { data: track, error: fetchError } = await supabase
      .from('music_tracks')
      .select('file_key')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // 删除本地文件
    if (track?.file_key) {
      try {
        const filePath = path.join(process.cwd(), 'public', track.file_key);
        if (existsSync(filePath)) {
          const { unlink } = await import('fs/promises');
          await unlink(filePath);
        }
      } catch {
        // 忽略文件删除失败
      }
    }

    // 删除数据库记录
    const { error } = await supabase.from('music_tracks').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
