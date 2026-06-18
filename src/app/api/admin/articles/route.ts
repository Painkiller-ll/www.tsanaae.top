import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

const supabase = getSupabaseClient();

// GET /api/admin/articles - 管理端获取所有文章（含待审核）
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('articles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ articles: data || [], total: count || 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '获取文章列表失败' }, { status: 500 });
  }
}

// PUT - 审核文章（批准/拒绝/设为精选）
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (authResult) return authResult;

    const body = await request.json();
    const { id, status, is_featured } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (typeof is_featured === 'boolean') updates.is_featured = is_featured;

    const { data, error } = await supabase
      .from('articles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ article: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '操作失败' }, { status: 500 });
  }
}

// DELETE - 删除文章
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少文章ID' }, { status: 400 });
    }

    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: '删除成功' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '删除失败' }, { status: 500 });
  }
}
