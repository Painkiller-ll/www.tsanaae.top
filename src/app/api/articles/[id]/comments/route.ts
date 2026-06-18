import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET /api/articles/[id]/comments - 获取文章评论
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from('article_comments')
      .select('id, content, author_name, created_at')
      .eq('article_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ comments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '获取评论失败' }, { status: 500 });
  }
}

// POST /api/articles/[id]/comments - 提交评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, author_name } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: '评论内容不能为空' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: '评论内容不能超过1000字' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('article_comments')
      .insert({
        article_id: parseInt(id),
        content: content.trim(),
        author_name: (author_name || '匿名用户').trim().substring(0, 50),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      comment: data,
      message: '评论已提交，等待审核后显示',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '提交评论失败' }, { status: 500 });
  }
}
