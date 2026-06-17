import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Delegate to PATCH - some clients use PUT for updates
  return PATCH(request, { params });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

    const { id } = await params;
    const supabase = getSupabaseClient();
    const body = await request.json();

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowedFields = ['title', 'description', 'cover_url', 'resource_type', 'category_id', 'author', 'tags', 'unlock_points', 'is_featured', 'is_published', 'extra_data', 'avg_rating', 'rating_count', 'sort_order'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    // 支持 sort_order_delta：相对调整排序
    if (body.sort_order_delta !== undefined) {
      const { data: current } = await supabase.from('resources').select('sort_order').eq('id', id).single();
      updates.sort_order = (current?.sort_order || 0) + Number(body.sort_order_delta);
    }

    const { error } = await supabase.from('resources').update(updates).eq('id', id);
    if (error) throw error;

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
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

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
