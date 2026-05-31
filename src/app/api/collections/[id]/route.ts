import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/collections/[id] - 获取合集详情
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: '合集不存在' }, { status: 404 });

    const { data: cgData } = await supabase
      .from('collection_games')
      .select('game_id, sort_order, games(*)')
      .eq('collection_id', id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({
      collection: {
        ...data,
        games: (cgData || []).map((cg: Record<string, unknown>) => cg.games).filter(Boolean),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/collections/[id] - 更新合集
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
    const body = await request.json();
    const { title, description, cover_image, is_active, sort_order, game_ids } = body;

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (cover_image !== undefined) updateData.cover_image = cover_image;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { data, error } = await supabase
      .from('collections')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update games if provided
    if (game_ids) {
      await supabase.from('collection_games').delete().eq('collection_id', id);
      if (game_ids.length > 0) {
        const cgInserts = game_ids.map((gid: string, idx: number) => ({
          collection_id: id,
          game_id: gid,
          sort_order: idx,
        }));
        await supabase.from('collection_games').insert(cgInserts);
      }
    }

    return NextResponse.json({ collection: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/collections/[id] - 删除合集
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

    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete collection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
