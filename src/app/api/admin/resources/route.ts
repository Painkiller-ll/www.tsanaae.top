import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    const supabase = getSupabaseClient();

    let query = supabase
      .from('resources')
      .select('*, category:resource_categories(id, name, slug)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (type) query = query.eq('resource_type', type);

    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, total: count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getSupabaseClient();

    const resourceData = {
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
    };

    const { data, error } = await supabase
      .from('resources')
      .insert(resourceData)
      .select()
      .single();

    if (error) throw error;

    // Insert download links if provided
    if (body.download_links && body.download_links.length > 0) {
      const links = body.download_links.map((l: { title: string; url: string; platform: string; is_free: boolean }) => ({
        resource_id: data.id,
        title: l.title || '下载链接',
        url: l.url,
        platform: l.platform || null,
        is_free: l.is_free !== false,
      }));
      await supabase.from('resource_downloads').insert(links);
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
