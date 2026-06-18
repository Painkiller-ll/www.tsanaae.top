import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import verifyAdminRequest from '@/lib/admin-verify';

// All updatable columns in site_settings table
const ALLOWED_FIELDS = [
  'site_name', 'site_description', 'footer_text',
  'contact_qq', 'contact_wechat', 'contact_email', 'contact_telegram', 'contact_github',
  'wechat_qr_code', 'share_template',
  'site_bg_color', 'site_card_color', 'site_accent_color',
  'site_logo_url', 'site_bg_image', 'about_text',
  'footer_links',
  'promo_title', 'promo_description', 'promo_qr_code_url', 'promo_mini_program_name', 'promo_tags',
] as const;

type AllowedField = typeof ALLOWED_FIELDS[number];

export async function PUT(request: Request) {
  const authErr = await verifyAdminRequest(request);
  if (authErr) return authErr;

  const body = await request.json();

  // Map frontend field names to DB column names
  const fieldMapping: Record<string, string> = {
    site_footer_text: 'footer_text',
    share_text_template: 'share_template',
  };

  // Build update object with only allowed fields
  const update: Record<string, unknown> = {};
  for (const [bodyKey, bodyValue] of Object.entries(body)) {
    // Map frontend name to DB column name
    const dbKey = fieldMapping[bodyKey] || bodyKey;

    if ((ALLOWED_FIELDS as readonly string[]).includes(dbKey)) {
      if (dbKey === 'footer_links') {
        // footer_links is jsonb, store as array
        update[dbKey] = Array.isArray(bodyValue) ? bodyValue : [];
      } else if (dbKey === 'promo_tags') {
        // promo_tags: comma-separated string → jsonb array
        const tags = typeof bodyValue === 'string'
          ? bodyValue.split(',').map((t: string) => t.trim()).filter(Boolean)
          : Array.isArray(bodyValue) ? bodyValue : [];
        update[dbKey] = tags;
      } else {
        update[dbKey] = String(bodyValue);
      }
    }
  }

  update.updated_at = new Date().toISOString();

  // There's only one row (id=1), update it
  const { error } = await supabase
    .from('site_settings')
    .update(update)
    .eq('id', 1);

  if (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: `更新设置失败: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
