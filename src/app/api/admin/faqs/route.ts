import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import verifyAdminRequest from '@/lib/admin-verify';
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ faqs: data || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authErr = await verifyAdminRequest(request);
  if (authErr) return authErr;

    const body = await request.json();
    const { question, answer, sort_order, is_active } = body;

    if (!question || !answer) {
      return NextResponse.json({ error: '问题和答案不能为空' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('faqs')
      .insert({ question, answer, sort_order: sort_order || 0, is_active: is_active !== false })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ faq: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
