import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.sort_order !== undefined) updateData.sort_order = body.sort_order;
    if (body.parent_id !== undefined) updateData.parent_id = body.parent_id;

    const { data, error } = await supabase
      .from('resource_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await verifyAdminRequest(request);
    if (authErr) return authErr;

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('resource_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
