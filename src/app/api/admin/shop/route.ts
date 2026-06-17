import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';
const supabase = getSupabaseClient();

// GET - List all shop items
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('point_shop_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ items: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Create shop item
export async function POST(request: NextRequest) {
  try {
    const authErr = await verifyAdminRequest(request);
  if (authErr) return authErr;

    const body = await request.json();
    const { name, description, type, cost, image_url, stock, is_active, metadata } = body;

    if (!name || !cost) {
      return NextResponse.json({ error: 'Name and cost are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('point_shop_items')
      .insert({
        name,
        description: description || null,
        type: type || 'virtual',
        cost,
        image_url: image_url || null,
        stock: stock ?? -1,
        is_active: is_active !== false,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ item: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
