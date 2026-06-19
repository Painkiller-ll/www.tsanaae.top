import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';

// GET - 获取所有广告
export async function GET(req: NextRequest) {
  const authError = await verifyAdminRequest(req);
  if (authError) return authError;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('homepage_ads')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST - 新增广告
export async function POST(req: NextRequest) {
  const authError = await verifyAdminRequest(req);
  if (authError) return authError;

  const body = await req.json();
  const { title, content, link_url, link_text, bg_color, sort_order, is_active } = body;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('homepage_ads')
    .insert({
      title: title || '',
      content: content || '',
      link_url: link_url || '',
      link_text: link_text || '',
      bg_color: bg_color || '',
      sort_order: sort_order || 0,
      is_active: is_active !== false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
