import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

export async function POST(request: Request) {
  try {
    const results: Record<string, string[]> = {
      site_settings: [],
      music_tracks: [],
      articles_table: [],
      article_comments_table: [],
      resources_table: [],
    };

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

    // promo_tags is jsonb, handle separately
    const { error: tagError } = await supabase
      .from('site_settings')
      .update({ promo_tags: ['免费资源', '收益支持'] })
      .eq('id', 1);
    if (tagError) {
      results.site_settings.push(`promo_tags: 需手动添加 - ${tagError.message}`);
    } else {
      results.site_settings.push('promo_tags: ok');
    }

    // banner_enabled is boolean
    const { error: bannerBoolError } = await supabase
      .from('site_settings')
      .update({ banner_enabled: true })
      .eq('id', 1);
    if (bannerBoolError) {
      results.site_settings.push(`banner_enabled: 需手动添加 - ${bannerBoolError.message}`);
    } else {
      results.site_settings.push('banner_enabled: ok');
    }

    // banner_items is jsonb
    const { error: bannerItemsError } = await supabase
      .from('site_settings')
      .update({ banner_items: [] })
      .eq('id', 1);
    if (bannerItemsError) {
      results.site_settings.push(`banner_items: 需手动添加 - ${bannerItemsError.message}`);
    } else {
      results.site_settings.push('banner_items: ok');
    }

    for (const m of siteMigrations) {
      const { error } = await supabase
        .from('site_settings')
        .update({ [m.column]: m.default })
        .eq('id', 1);

      if (error) {
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          results.site_settings.push(`${m.column}: 需手动添加 - ${error.message}`);
        } else {
          results.site_settings.push(`${m.column}: 错误 - ${error.message}`);
        }
      } else {
        results.site_settings.push(`${m.column}: ok`);
      }
    }

    // === music_tracks columns ===
    const { data: musicCheck, error: musicError } = await supabase
      .from('music_tracks')
      .select('cover_image')
      .limit(1);

    if (musicError && (musicError.message.includes('column') || musicError.message.includes('does not exist'))) {
      results.music_tracks.push('cover_image: 需手动添加 - 请在Supabase SQL Editor执行: ALTER TABLE music_tracks ADD COLUMN cover_image text DEFAULT \'\';');
    } else {
      results.music_tracks.push('cover_image: ok');
    }

    // === articles table ===
    const { error: articlesError } = await supabase
      .from('articles')
      .select('id')
      .limit(1);

    if (articlesError) {
      results.articles_table.push('articles表不存在，需手动创建 - 请在Supabase SQL Editor执行创建SQL');
    } else {
      results.articles_table.push('articles表: ok');
    }

    // === article_comments table ===
    const { error: commentsError } = await supabase
      .from('article_comments')
      .select('id')
      .limit(1);

    if (commentsError) {
      results.article_comments_table.push('article_comments表不存在，需手动创建 - 请在Supabase SQL Editor执行创建SQL');
    } else {
      results.article_comments_table.push('article_comments表: ok');
    }

    // === resources table - 投稿相关列 ===
    const { data: resCheck, error: resError } = await supabase
      .from('resources')
      .select('status')
      .limit(1);

    if (resError && (resError.message.includes('column') || resError.message.includes('does not exist'))) {
      results.resources_table.push('status: 需手动添加 - ALTER TABLE resources ADD COLUMN status text DEFAULT \'approved\';');
    } else {
      results.resources_table.push('status: ok');
    }

    const { data: resCheck2, error: resError2 } = await supabase
      .from('resources')
      .select('download_url')
      .limit(1);

    if (resError2 && (resError2.message.includes('column') || resError2.message.includes('does not exist'))) {
      results.resources_table.push('download_url: 需手动添加 - ALTER TABLE resources ADD COLUMN download_url text DEFAULT \'\';');
    } else {
      results.resources_table.push('download_url: ok');
    }

    const { data: resCheck3, error: resError3 } = await supabase
      .from('resources')
      .select('submitter_name')
      .limit(1);

    if (resError3 && (resError3.message.includes('column') || resError3.message.includes('does not exist'))) {
      results.resources_table.push('submitter_name: 需手动添加 - ALTER TABLE resources ADD COLUMN submitter_name text DEFAULT \'\';');
    } else {
      results.resources_table.push('submitter_name: ok');
    }

    // === comments table - 评论审核 ===
    const { data: comCheck, error: comError } = await supabase
      .from('comments')
      .select('status')
      .limit(1);

    if (comError && (comError.message.includes('column') || comError.message.includes('does not exist'))) {
      results.comments_table = ['status: 需手动添加 - ALTER TABLE comments ADD COLUMN status text DEFAULT \'approved\'; UPDATE comments SET status = \'approved\' WHERE status IS NULL;'];
    } else {
      results.comments_table = ['status: ok'];
    }

    return NextResponse.json({
      migrationResults: results,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
