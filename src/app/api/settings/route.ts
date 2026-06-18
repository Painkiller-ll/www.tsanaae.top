import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

export async function GET() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 });
  }

  return NextResponse.json(data);
}
