import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

// PUT - 更新广告
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('homepage_ads')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// DELETE - 删除广告
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await verifyAdminRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('homepage_ads').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
