import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

export async function GET() {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {
    return NextResponse.json({ error: '获取设置失败' }, { status: 500 });
  }

  // Map DB column names to frontend field names
  const result: Record<string, unknown> = {
    site_name: data.site_name || '',
    site_description: data.site_description || '',
    site_footer_text: data.footer_text || '',
    contact_qq: data.contact_qq || '',
    contact_wechat: data.contact_wechat || '',
    contact_email: data.contact_email || '',
    contact_telegram: data.contact_telegram || '',
    contact_github: data.contact_github || '',
    wechat_qr_code: data.wechat_qr_code || '',
    share_text_template: data.share_template || '',
    site_bg_color: data.site_bg_color || '#0f0f13',
    site_card_color: data.site_card_color || '#1a1a24',
    site_accent_color: data.site_accent_color || '#7c3aed',
    site_logo_url: data.site_logo_url || '',
    site_bg_image: data.site_bg_image || '',
    about_text: data.about_text || '',
    promo_title: data.promo_title || '推荐小程序',
    promo_description: data.promo_description || '扫码体验精选小程序，支持站长持续更新优质资源',
    promo_qr_code_url: data.promo_qr_code_url || '',
    promo_mini_program_name: data.promo_mini_program_name || '',
    promo_tags: typeof data.promo_tags === 'string' ? data.promo_tags : (Array.isArray(data.promo_tags) ? data.promo_tags.join(',') : ''),
    promo_icon_url: data.promo_icon_url || '',
    footer_links: data.footer_links || [],
  };

  return NextResponse.json(result);
}
