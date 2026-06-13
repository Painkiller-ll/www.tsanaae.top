import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!q?.trim()) return NextResponse.json({ data: [], total: 0 });

    const supabase = getSupabaseClient();

    let query = supabase
      .from('resources')
      .select('*, category:resource_categories(id, name, slug)', { count: 'exact' })
      .eq('is_published', true)
      .or(`title.ilike.%${q.trim()}%,author.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%`)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (type && type !== 'all') query = query.eq('resource_type', type);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({ data, total: count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
