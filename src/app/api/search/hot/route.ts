import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/search/hot - 获取热门搜索词
export async function GET() {
  try {
    const supabase = getSupabaseClient();

    // 获取最近7天的搜索关键词统计
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
      .from('search_logs')
      .select('keyword')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (error) throw error;

    // 统计关键词频率
    const keywordCount: Record<string, number> = {};
    (data || []).forEach((item: { keyword: string }) => {
      const kw = item.keyword.trim().toLowerCase();
      if (kw.length >= 2) {
        keywordCount[kw] = (keywordCount[kw] || 0) + 1;
      }
    });

    // 排序取前10
    const hotKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // 如果搜索记录太少，返回默认热门词
    if (hotKeywords.length < 3) {
      const defaultKeywords = [
        { keyword: '动作', count: 99 },
        { keyword: '冒险', count: 88 },
        { keyword: '策略', count: 77 },
        { keyword: 'RPG', count: 66 },
        { keyword: '射击', count: 55 },
        { keyword: '模拟', count: 44 },
        { keyword: '独立', count: 33 },
        { keyword: '多人', count: 22 },
        { keyword: '像素', count: 11 },
        { keyword: '休闲', count: 10 },
      ];
      return NextResponse.json({ keywords: defaultKeywords });
    }

    return NextResponse.json({ keywords: hotKeywords });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch hot keywords';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/search/hot - 记录搜索日志
export async function POST(request: Request) {
  try {
    const { keyword, user_id } = await request.json();

    if (!keyword || keyword.trim().length < 2) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabaseClient();

    await supabase
      .from('search_logs')
      .insert({
        keyword: keyword.trim(),
        user_id: user_id || null,
      });

    return NextResponse.json({ ok: true });
  } catch {
    // 静默失败，不影响搜索
    return NextResponse.json({ ok: true });
  }
}
