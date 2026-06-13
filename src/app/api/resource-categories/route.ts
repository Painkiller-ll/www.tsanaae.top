import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const topLevel = searchParams.get('top_level');
    const supabase = getSupabaseClient();

    let query = supabase.from('resource_categories').select('*').order('sort_order');
    if (type) query = query.eq('resource_type', type);
    if (topLevel === 'true') query = query.is('parent_id', null);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
