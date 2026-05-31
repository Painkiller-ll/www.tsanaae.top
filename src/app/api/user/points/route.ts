import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
const supabase = getSupabaseClient();
import { getCurrentUserId } from '@/lib/user-auth';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('point_transactions')
      .select('id, amount, balance_after, reason, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: '获取积分记录失败' }, { status: 500 });
    }

    return NextResponse.json({ transactions: data || [] });
  } catch {
    return NextResponse.json({ error: '获取积分记录失败' }, { status: 500 });
  }
}
