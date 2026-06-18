import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

const supabase = getSupabaseClient();

// GET /api/admin/article-comments - 管理端获取所有评论
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const article_id = searchParams.get('article_id');

    let query = supabase
      .from('article_comments')
      .select('*, articles(title)')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (article_id) query = query.eq('article_id', article_id);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ comments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '获取评论列表失败' }, { status: 500 });
  }
}

// PUT - 审核评论
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (authResult) return authResult;

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('article_comments')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ comment: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '操作失败' }, { status: 500 });
  }
}

// DELETE - 删除评论
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (authResult) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少评论ID' }, { status: 400 });
    }

    const { error } = await supabase.from('article_comments').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: '删除成功' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '删除失败' }, { status: 500 });
  }
}
