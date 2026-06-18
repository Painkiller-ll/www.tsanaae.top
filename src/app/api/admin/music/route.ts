import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

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

// POST: 添加新曲目（在线URL模式）
export async function POST(request: NextRequest) {
  try {
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

    const body = await request.json();
    const { title, artist, cover_image, music_url } = body;

    if (!music_url) {
      return NextResponse.json({ error: '请输入音乐播放链接' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: '请输入曲目标题' }, { status: 400 });
    }

    // 验证URL格式
    try {
      new URL(music_url);
    } catch {
      return NextResponse.json({ error: '音乐链接格式无效，请输入有效的URL' }, { status: 400 });
    }

    // 获取最大 sort_order
    const supabase = getSupabaseClient();
    const { data: maxSort } = await supabase
      .from('music_tracks')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1);

    const sortOrder = maxSort && maxSort.length > 0 ? (maxSort[0] as { sort_order: number }).sort_order + 1 : 0;

    // 写入数据库，file_key 字段存储在线URL
    const { data, error } = await supabase
      .from('music_tracks')
      .insert({
        title,
        artist: artist || null,
        cover_image: cover_image || null,
        file_key: music_url,
        sort_order: sortOrder,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ track: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : '添加失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT: 更新曲目
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, artist, cover_image, music_url, sort_order, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少曲目ID' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (artist !== undefined) updateData.artist = artist;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (music_url !== undefined) updateData.file_key = music_url;
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
    const { error } = await supabase.from('music_tracks').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
