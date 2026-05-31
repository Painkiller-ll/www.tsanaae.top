import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/admin/stats - 管理后台统计数据
export async function GET(request: Request) {
  try {
    const { verifyToken } = await import('@/lib/admin-auth');
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // 并行获取各项统计
    const [gamesRes, usersRes, commentsRes, downloadsRes, todaySignupsRes, todayCommentsRes, ratingsRes, topGamesRes] = await Promise.all([
      supabase.from('games').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('comments').select('*', { count: 'exact', head: true }),
      supabase.from('games').select('download_count'),
      supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('game_ratings').select('rating').gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from('games').select('id, title, likes, download_count, avg_rating').order('likes', { ascending: false }).limit(5),
    ]);

    // 计算总下载量
    const downloadData = downloadsRes.data as { download_count: number }[] | null;
    const totalDownloadCount = downloadData?.reduce((sum, g) => sum + (g.download_count || 0), 0) || 0;

    // 今日评分数
    const todayRatings = (ratingsRes.data as unknown[] | null)?.length || 0;

    // 最近7天注册趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: weeklySignups } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    // 按天分组统计
    const signupTrend: Record<string, number> = {};
    (weeklySignups || []).forEach((u: { created_at: string }) => {
      const day = new Date(u.created_at).toISOString().split('T')[0];
      signupTrend[day] = (signupTrend[day] || 0) + 1;
    });

    return NextResponse.json({
      stats: {
        totalGames: gamesRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalComments: commentsRes.count || 0,
        totalDownloads: totalDownloadCount,
        todaySignups: todaySignupsRes.count || 0,
        todayComments: todayCommentsRes.count || 0,
        todayRatings,
        topGames: topGamesRes.data || [],
        signupTrend,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
