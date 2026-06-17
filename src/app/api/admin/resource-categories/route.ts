import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('resource_categories')
      .select('*')
      .order('sort_order');

    if (error) throw error;
    return NextResponse.json({ categories: data || [] });
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
      .from('resource_categories')
      .insert({
        name: body.name,
        slug: body.slug,
        resource_type: body.resource_type,
        parent_id: body.parent_id || null,
        icon: body.icon || null,
        sort_order: body.sort_order || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ category: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
