import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();

export async function POST(request: Request) {
  // Migration endpoint - no auth required for one-time setup

  try {
    const results: Record<string, string[]> = {
      site_settings: [],
      music_tracks: [],
    };

    // === site_settings columns ===
    const siteMigrations = [
      { column: 'site_bg_color', default: '#0f0f13' },
      { column: 'site_card_color', default: '#1a1a24' },
      { column: 'site_accent_color', default: '#7c3aed' },
      { column: 'site_logo_url', default: '' },
      { column: 'site_bg_image', default: '' },
      { column: 'about_text', default: '' },
    ];

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
    // Check if cover_image column exists by trying to select it
    const { data: musicCheck, error: musicError } = await supabase
      .from('music_tracks')
      .select('cover_image')
      .limit(1);

    if (musicError && (musicError.message.includes('column') || musicError.message.includes('does not exist'))) {
      results.music_tracks.push('cover_image: 需手动添加 - 请在Supabase SQL Editor执行: ALTER TABLE music_tracks ADD COLUMN cover_image text DEFAULT \'\';');
    } else {
      results.music_tracks.push('cover_image: ok');
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
