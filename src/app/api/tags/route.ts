import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw new Error(`Failed to fetch tags: ${error.message}`);

    return NextResponse.json({ tags: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
