import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

import verifyAdminRequest from '@/lib/admin-verify';

export async function GET(request: Request) {
  try {
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const resourceType = searchParams.get('resource_type') || '';
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('resources')
      .select('id, title, resource_type, cover_url, avg_rating, view_count, is_published, is_featured, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (resourceType) query = query.eq('resource_type', resourceType);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ resources: data || [], total: count || 0 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

    const supabase = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from('resources')
      .insert({
        title: body.title,
        description: body.description || null,
        cover_url: body.cover_url || null,
        resource_type: body.resource_type,
        category_id: body.category_id || null,
        author: body.author || null,
        tags: body.tags || [],
        unlock_points: body.unlock_points || 0,
        is_featured: body.is_featured || false,
        is_published: body.is_published !== false,
        extra_data: body.extra_data || {},
      })
      .select()
      .single();

    if (error) throw error;

    // 插入下载链接
    if (body.download_links?.length) {
      const links = body.download_links.map((l: any, i: number) => ({
        resource_id: data.id,
        title: l.title || '下载链接',
        url: l.url,
        platform: l.platform || null,
        is_free: l.is_free !== false,
        sort_order: i,
      }));
      await supabase.from('resource_downloads').insert(links);
    }

    return NextResponse.json({ resource: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
