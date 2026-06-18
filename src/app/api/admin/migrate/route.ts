import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import verifyAdminRequest from '@/lib/admin-verify';

export async function POST(request: Request) {
  const authErr = await verifyAdminRequest(request);
  if (authErr) return authErr;

  try {
    // Add missing columns to site_settings table
    const migrations = [
      { column: 'site_bg_color', type: 'TEXT', default: "'#0f0f13'" },
      { column: 'site_card_color', type: 'TEXT', default: "'#1a1a24'" },
      { column: 'site_accent_color', type: 'TEXT', default: "'#7c3aed'" },
      { column: 'site_logo_url', type: 'TEXT', default: "''" },
      { column: 'site_bg_image', type: 'TEXT', default: "''" },
      { column: 'about_text', type: 'TEXT', default: "''" },
    ];

    const results = [];

    for (const m of migrations) {
      // Try to insert a default value - if column doesn't exist, Supabase will error
      // We use a workaround: try to update with the column, if it fails the column doesn't exist
      const { error } = await supabase
        .from('site_settings')
        .update({ [m.column]: m.default.replace(/'/g, '') })
        .eq('id', 1);

      if (error) {
        if (error.message.includes('column') || error.message.includes('does not exist')) {
          results.push({ column: m.column, status: 'needs_manual_add', error: error.message });
        } else {
          results.push({ column: m.column, status: 'error', error: error.message });
        }
      } else {
        results.push({ column: m.column, status: 'ok' });
      }
    }

    // Also check current table structure
    const { data, error: selectError } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .single();

    return NextResponse.json({
      migrationResults: results,
      currentData: selectError ? selectError.message : data,
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
