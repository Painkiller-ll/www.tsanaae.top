import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET 获取用户签到日历数据
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('user_token')?.value;
    if (!token) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }

    const { verifyUserToken } = await import('@/lib/user-auth');
    const userId = await verifyUserToken(token);
    if (!userId) {
      return NextResponse.json({ error: '无效凭证' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from('point_transactions')
      .select('created_at')
      .eq('user_id', userId)
      .eq('type', 'checkin')
      .gte('created_at', startDate)
      .lt('created_at', endDate);

    if (error) throw error;

    const checkedDays = (data || []).map((t: { created_at: string }) => {
      const d = new Date(t.created_at);
      return d.getDate();
    });

    // 去重
    const uniqueDays = [...new Set(checkedDays)];

    return NextResponse.json({ checked_days: uniqueDays, year, month });
  } catch (err) {
    console.error('获取签到日历失败:', err);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
