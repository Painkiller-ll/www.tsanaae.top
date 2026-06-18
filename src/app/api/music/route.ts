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

    return NextResponse.json({ tracks: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取播放列表失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
