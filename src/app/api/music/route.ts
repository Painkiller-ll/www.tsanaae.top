import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

    // 本地文件直接使用 file_key 作为 URL 路径
    const tracks = (data || []).map((track: Record<string, unknown>) => {
      return { ...track, file_url: track.file_key as string };
    });

    return NextResponse.json({ tracks });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取播放列表失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
