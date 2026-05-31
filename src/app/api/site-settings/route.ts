import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

export async function GET() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value');

  if (error) {
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 });
  }

  // Convert array to object
  const settings: Record<string, string> = {};
  for (const item of data || []) {
    settings[item.key] = item.value;
  }

  return NextResponse.json(settings);
}
