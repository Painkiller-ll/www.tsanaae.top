import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取活跃广告（公开）
export async function GET() {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('homepage_ads')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) return NextResponse.json({ data: [] }, { status: 200 });
  return NextResponse.json({ data: data || [] });
}
