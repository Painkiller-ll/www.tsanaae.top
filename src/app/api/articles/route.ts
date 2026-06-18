import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// GET /api/articles - 获取文章列表（只返回已审核的）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');

    let query = supabase
      .from('articles')
      .select('id, title, author_name, category, tags, is_featured, view_count, cover_image, created_at, updated_at', { count: 'exact' })
      .eq('status', 'approved')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (featured === 'true') query = query.eq('is_featured', true);

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      articles: data || [],
      total: count || 0,
      page,
      limit,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '获取文章列表失败' }, { status: 500 });
  }
}

// POST /api/articles - 提交新文章（用户端，默认pending状态）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, author_name, author_contact, category, tags, cover_image } = body;

    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 });
    }

    if (title.length > 100) {
      return NextResponse.json({ error: '标题不能超过100字' }, { status: 400 });
    }

    if (content.length > 50000) {
      return NextResponse.json({ error: '内容不能超过50000字' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: title.trim(),
        content: content.trim(),
        author_name: (author_name || '匿名用户').trim(),
        author_contact: (author_contact || '').trim(),
        category: (category || '').trim(),
        tags: tags || [],
        cover_image: (cover_image || '').trim(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ article: data, message: '文章提交成功，等待审核' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '提交文章失败' }, { status: 500 });
  }
}
