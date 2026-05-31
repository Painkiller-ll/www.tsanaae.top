import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// PUT /api/admin/tags/[id] - 更新标签
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: '标签名不能为空' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tags')
      .update({ name: name.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ tag: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/admin/tags/[id] - 删除标签
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // 先删除关联表
    await supabase.from('game_tags').delete().eq('tag_id', id);
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
