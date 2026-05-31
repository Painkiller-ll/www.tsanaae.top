import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function PUT(request: Request) {
  // Check admin auth
  const isAuth = await isAdminAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: '未授权' }, { status: 401 });
  }

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
