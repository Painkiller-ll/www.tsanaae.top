import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import verifyAdminRequest from '@/lib/admin-verify';

export async function PUT(request: Request) {
  const authErr = await verifyAdminRequest(request);
  if (authErr) return authErr;

  const body = await request.json();

  // Upsert each setting
  for (const [key, value] of Object.entries(body)) {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      return NextResponse.json({ error: `更新设置 ${key} 失败` }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
