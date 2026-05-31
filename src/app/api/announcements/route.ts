import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - Get active announcements
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all') === 'true';

    let query = client
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!all) {
      // Only active announcements
      query = query.eq('is_active', 'true' as unknown as boolean);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to fetch announcements: ${error.message}`);

    // Filter by date range if not fetching all
    let announcements = data || [];
    if (!all) {
      const now = new Date().toISOString();
      announcements = announcements.filter((a: {
        start_date: string | null;
        end_date: string | null;
      }) => {
        if (a.start_date && a.start_date > now) return false;
        if (a.end_date && a.end_date < now) return false;
        return true;
      });
    }

    return NextResponse.json({ announcements });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create announcement (admin)
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { title, content, type, is_active, start_date, end_date } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const { data, error } = await client
      .from('announcements')
      .insert({
        title,
        content,
        type: type || 'info',
        is_active: is_active !== false,
        start_date: start_date || null,
        end_date: end_date || null,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create announcement: ${error.message}`);

    return NextResponse.json({ announcement: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT - Update announcement (admin)
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, title, content, type, is_active, start_date, end_date } = body;

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (type !== undefined) updateData.type = type;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;

    const { data, error } = await client
      .from('announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update announcement: ${error.message}`);

    return NextResponse.json({ announcement: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete announcement (admin)
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID is required' }, { status: 400 });
    }

    const { error } = await client
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete announcement: ${error.message}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
