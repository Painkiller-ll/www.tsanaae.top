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

// GET: 获取播放列表（公开）
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // 为每首曲目生成签名URL
    const tracks = await Promise.all(
      (data || []).map(async (track: Record<string, unknown>) => {
        let fileUrl = '';
        try {
          fileUrl = await storage.generatePresignedUrl({
            key: track.file_key as string,
            expireTime: 3600, // 1小时有效期
          });
        } catch {
          fileUrl = '';
        }
        return { ...track, file_url: fileUrl };
      })
    );

    return NextResponse.json({ tracks });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取播放列表失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: 上传新曲目（管理员）
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const artist = formData.get('artist') as string | null;
    const coverImage = formData.get('cover_image') as string | null;
    const sortOrder = formData.get('sort_order') as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: '缺少文件或标题' }, { status: 400 });
    }

    // 上传音乐文件到对象存储
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileKey = await storage.uploadFile({
      fileContent: fileBuffer,
      fileName: `music/${Date.now()}_${file.name}`,
      contentType: file.type || 'audio/mpeg',
    });

    // 保存到数据库
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('music_tracks')
      .insert({
        title,
        artist: artist || null,
        cover_image: coverImage || null,
        file_key: fileKey,
        sort_order: sortOrder ? parseInt(sortOrder) : 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ track: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '上传失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
