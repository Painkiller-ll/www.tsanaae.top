import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

    const updates: Record<string, any> = {};
    const allowed = ['name', 'slug', 'resource_type', 'parent_id', 'icon', 'sort_order'];
    for (const field of allowed) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const { error } = await supabase.from('resource_categories').update(updates).eq('id', id);
    if (error) throw error;

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

    const { error } = await supabase.from('resource_categories').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
