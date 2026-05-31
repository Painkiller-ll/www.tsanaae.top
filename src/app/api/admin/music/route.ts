import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

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

    // 删除对象存储中的文件
    if (track?.file_key) {
      try {
        await storage.deleteFile({ fileKey: track.file_key });
      } catch {
        // 忽略存储删除失败
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
