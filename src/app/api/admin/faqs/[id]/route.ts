import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await verifyAdminRequest(request);
  if (authErr) return authErr;

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('faqs')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ faq: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authErr = await verifyAdminRequest(request);
  if (authErr) return authErr;

    const { id } = await params;
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('faqs').delete().eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
