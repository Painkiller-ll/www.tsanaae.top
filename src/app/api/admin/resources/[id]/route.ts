import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('resources')
      .select('*, category:resource_categories(id, name, slug), downloads:resource_downloads(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    const allowedFields = ['title', 'description', 'cover_url', 'resource_type', 'category_id',
      'author', 'tags', 'unlock_points', 'is_featured', 'is_published', 'extra_data'];

    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const { data, error } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update download links if provided
    if (body.download_links !== undefined) {
      await supabase.from('resource_downloads').delete().eq('resource_id', id);
      if (body.download_links.length > 0) {
        const links = body.download_links.map((l: { title: string; url: string; platform: string; is_free: boolean }) => ({
          resource_id: parseInt(id),
          title: l.title || '下载链接',
          url: l.url,
          platform: l.platform || null,
          is_free: l.is_free !== false,
        }));
        await supabase.from('resource_downloads').insert(links);
      }
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
