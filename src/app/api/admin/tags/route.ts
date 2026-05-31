import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/admin/tags - 获取所有标签
export async function GET(request: Request) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({ tags: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch tags';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/admin/tags - 创建标签
export async function POST(request: Request) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: '标签名不能为空' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('tags')
      .insert({ name: name.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: '标签已存在' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ tag: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create tag';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
