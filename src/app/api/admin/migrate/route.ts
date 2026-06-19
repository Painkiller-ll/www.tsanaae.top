import { NextResponse } from 'next/server';
import verifyAdminRequest from '@/lib/admin-verify';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: Request) {
  const authError = await verifyAdminRequest(request);
  if (authError) return authError;

  const supabase = getSupabaseClient();
  const messages: string[] = [];

  try {
    // === site_settings columns ===
    const siteMigrations = [
      { column: 'site_bg_color', default: '#0f0f13' },
      { column: 'site_card_color', default: '#1a1a24' },
      { column: 'site_accent_color', default: '#7c3aed' },
      { column: 'site_logo_url', default: '' },
      { column: 'site_bg_image', default: '' },
      { column: 'about_text', default: '' },
      { column: 'promo_title', default: '推荐小程序' },
      { column: 'promo_description', default: '扫码体验精选小程序，支持站长持续更新优质资源' },
      { column: 'promo_qr_code_url', default: '' },
      { column: 'promo_mini_program_name', default: '' },
      { column: 'promo_icon_url', default: '' },
      { column: 'banner_title', default: '' },
      { column: 'banner_subtitle', default: '' },
      { column: 'banner_link_url', default: '' },
      { column: 'banner_link_text', default: '' },
      { column: 'banner_bg_color', default: '' },
    ];

    for (const m of siteMigrations) {
      const { error } = await supabase
        .from('site_settings')
        .update({ [m.column]: m.default })
        .eq('id', 1);
      if (error) {
        messages.push(`[site_settings.${m.column}] 需手动添加: ALTER TABLE site_settings ADD COLUMN ${m.column} text DEFAULT '${m.default}';`);
      } else {
        messages.push(`[site_settings.${m.column}] ok`);
      }
    }

    // promo_tags jsonb
    const { error: tagError } = await supabase.from('site_settings').update({ promo_tags: ['免费资源', '收益支持'] }).eq('id', 1);
    messages.push(tagError ? '[site_settings.promo_tags] 需手动添加: ALTER TABLE site_settings ADD COLUMN promo_tags jsonb DEFAULT \'[]\';' : '[site_settings.promo_tags] ok');

    // banner_enabled boolean
    const { error: bannerBoolError } = await supabase.from('site_settings').update({ banner_enabled: true }).eq('id', 1);
    messages.push(bannerBoolError ? '[site_settings.banner_enabled] 需手动添加: ALTER TABLE site_settings ADD COLUMN banner_enabled boolean DEFAULT true;' : '[site_settings.banner_enabled] ok');

    // banner_items jsonb
    const { error: bannerItemsError } = await supabase.from('site_settings').update({ banner_items: [] }).eq('id', 1);
    messages.push(bannerItemsError ? '[site_settings.banner_items] 需手动添加: ALTER TABLE site_settings ADD COLUMN banner_items jsonb DEFAULT \'[]\';' : '[site_settings.banner_items] ok');

    // === music_tracks ===
    const { error: musicError } = await supabase.from('music_tracks').select('cover_image').limit(1);
    messages.push(musicError ? '[music_tracks.cover_image] 需手动添加: ALTER TABLE music_tracks ADD COLUMN cover_image text DEFAULT \'\';' : '[music_tracks.cover_image] ok');

    // === articles table ===
    const { error: articlesError } = await supabase.from('articles').select('id').limit(1);
    messages.push(articlesError ? '[articles] 表不存在，需手动创建' : '[articles] ok');

    // === article_comments table ===
    const { error: commentsTableError } = await supabase.from('article_comments').select('id').limit(1);
    messages.push(commentsTableError ? '[article_comments] 表不存在，需手动创建' : '[article_comments] ok');

    // === resources table ===
    const resColumns = ['status', 'download_url', 'submitter_name', 'submitter_contact'];
    for (const col of resColumns) {
      const { error } = await supabase.from('resources').select(col).limit(1);
      messages.push(error ? `[resources.${col}] 需手动添加: ALTER TABLE resources ADD COLUMN ${col} text DEFAULT '';` : `[resources.${col}] ok`);
    }

    // === comments table - status column ===
    const { error: comStatusError } = await supabase.from('comments').select('status').limit(1);
    messages.push(comStatusError ? '[comments.status] 需手动添加: ALTER TABLE comments ADD COLUMN status text DEFAULT \'approved\';' : '[comments.status] ok');

    // === homepage_ads table ===
    const { error: adsTableError } = await supabase.from('homepage_ads').select('id').limit(1);
    if (adsTableError) {
      messages.push('[homepage_ads] 表不存在，需手动创建:');
      messages.push('CREATE TABLE IF NOT EXISTS homepage_ads (id serial PRIMARY KEY, title text NOT NULL DEFAULT \'\', content text NOT NULL DEFAULT \'\', link_url text DEFAULT \'\', link_text text DEFAULT \'\', bg_color text DEFAULT \'\', sort_order int DEFAULT 0, is_active boolean DEFAULT true, created_at timestamptz DEFAULT now());');
    } else {
      messages.push('[homepage_ads] ok');
    }

    return NextResponse.json({ success: true, messages });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg, messages }, { status: 500 });
  }
}
