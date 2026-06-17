import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // 获取下载链接
    const { data: links } = await supabase
      .from('resource_downloads')
      .select('*')
      .eq('resource_id', id)
      .order('sort_order');

    return NextResponse.json({ resource: data, download_links: links || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();
    const body = await request.json();

    // 构建更新对象（只更新传入的字段）
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowedFields = ['title', 'description', 'cover_url', 'resource_type', 'category_id', 'author', 'tags', 'unlock_points', 'is_featured', 'is_published', 'extra_data'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const { error } = await supabase.from('resources').update(updates).eq('id', id);
    if (error) throw error;

    // 更新下载链接（如果传了）
    if (body.download_links !== undefined) {
      await supabase.from('resource_downloads').delete().eq('resource_id', id);
      if (body.download_links?.length) {
        const links = body.download_links.map((l: any, i: number) => ({
          resource_id: parseInt(id),
          title: l.title || '下载链接',
          url: l.url,
          platform: l.platform || null,
          is_free: l.is_free !== false,
          sort_order: i,
        }));
        await supabase.from('resource_downloads').insert(links);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
