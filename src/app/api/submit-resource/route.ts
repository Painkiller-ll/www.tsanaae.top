import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const supabase = getSupabaseClient();

// POST /api/submit-resource - 用户投稿资源（默认pending状态）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, download_url, resource_type, category_id, author, tags, cover_url, submitter_name, submitter_contact } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: '资源名称不能为空' }, { status: 400 });
    }

    if (!resource_type || !resource_type.trim()) {
      return NextResponse.json({ error: '请选择资源类型' }, { status: 400 });
    }

    if (!download_url || !download_url.trim()) {
      return NextResponse.json({ error: '请提供下载链接' }, { status: 400 });
    }

    // 简单的URL格式验证
    try {
      new URL(download_url.trim());
    } catch {
      return NextResponse.json({ error: '下载链接格式不正确' }, { status: 400 });
    }

    if (title.length > 100) {
      return NextResponse.json({ error: '资源名称不能超过100字' }, { status: 400 });
    }

    if (description && description.length > 2000) {
      return NextResponse.json({ error: '描述不能超过2000字' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: title.trim(),
        description: (description || '').trim(),
        cover_url: (cover_url || '').trim() || null,
        resource_type: resource_type.trim(),
        category_id: category_id || null,
        author: (author || '').trim() || null,
        tags: tags || [],
        download_url: download_url.trim(),
        submitter_name: (submitter_name || '匿名用户').trim(),
        submitter_contact: (submitter_contact || '').trim(),
        status: 'pending',
        is_published: false,
        is_featured: false,
        unlock_points: 0,
        avg_rating: 0,
        rating_count: 0,
        view_count: 0,
        like_count: 0,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ resource: data, message: '资源投稿成功，等待管理员审核' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '投稿失败' }, { status: 500 });
  }
}
