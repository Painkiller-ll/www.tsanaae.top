import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET /api/articles/[id] - 获取文章详情 + 评论
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 获取文章详情
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    if (error || !article) {
      return NextResponse.json({ error: '文章不存在' }, { status: 404 });
    }

    // 增加浏览量
    await supabase
      .from('articles')
      .update({ view_count: (article.view_count || 0) + 1 })
      .eq('id', id);

    // 获取已审核的评论
    const { data: comments } = await supabase
      .from('article_comments')
      .select('id, content, author_name, created_at')
      .eq('article_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: true });

    return NextResponse.json({
      article: { ...article, view_count: (article.view_count || 0) + 1 },
      comments: comments || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '获取文章失败' }, { status: 500 });
  }
}
