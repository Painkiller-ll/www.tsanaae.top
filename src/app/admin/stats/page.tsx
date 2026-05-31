'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface StatItem {
  label: string;
  value: number | string;
  icon: string;
  color: string;
}

interface TopGame {
  id: string;
  title: string;
  likes: number;
  download_count: number;
  avg_rating: number;
}

export default function AdminStatsPage() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [topGames, setTopGames] = useState<TopGame[]>([]);
  const [signupTrend, setSignupTrend] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('admin_token='))
        ?.split('=')[1];

      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.stats) {
        const s = data.stats;
        setStats([
          { label: '总游戏数', value: s.totalGames, icon: '🎮', color: 'from-purple-500/20 to-purple-500/5' },
          { label: '总用户数', value: s.totalUsers, icon: '👤', color: 'from-blue-500/20 to-blue-500/5' },
          { label: '总评论数', value: s.totalComments, icon: '💬', color: 'from-green-500/20 to-green-500/5' },
          { label: '总下载量', value: s.totalDownloads, icon: '📥', color: 'from-yellow-500/20 to-yellow-500/5' },
          { label: '今日注册', value: s.todaySignups, icon: '🆕', color: 'from-cyan-500/20 to-cyan-500/5' },
          { label: '今日评论', value: s.todayComments, icon: '✍️', color: 'from-pink-500/20 to-pink-500/5' },
          { label: '今日评分', value: s.todayRatings, icon: '⭐', color: 'from-orange-500/20 to-orange-500/5' },
        ]);
        setTopGames(s.topGames || []);
        setSignupTrend(s.signupTrend || {});
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Compute max value for trend chart
  const trendDays = Object.keys(signupTrend).sort();
  const maxTrend = Math.max(...Object.values(signupTrend), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">数据统计</h1>
        <button
          onClick={() => fetchStats()}
          className="rounded-xl px-4 py-2 text-sm font-medium text-foreground border border-border hover:bg-secondary/50 transition-colors"
        >
          刷新数据
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border border-border/50 bg-gradient-to-br ${stat.color} p-5`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Registration Trend */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">近7天注册趋势</h2>
              {trendDays.length > 0 ? (
                <div className="flex items-end gap-2 h-40">
                  {trendDays.map((day) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-muted-foreground">{signupTrend[day]}</span>
                      <div
                        className="w-full rounded-t-lg bg-primary/60 hover:bg-primary transition-colors"
                        style={{ height: `${(signupTrend[day] / maxTrend) * 100}%`, minHeight: '4px' }}
                      />
                      <span className="text-[10px] text-muted-foreground">{day.slice(5)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无数据</p>
              )}
            </div>

            {/* Top Games */}
            <div className="rounded-2xl border border-border/50 bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">热门游戏 TOP5</h2>
              <div className="space-y-3">
                {topGames.map((game, idx) => (
                  <Link
                    key={game.id}
                    href={`/game/${game.id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/30 transition-colors"
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                      idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                      idx === 2 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-secondary/30 text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{game.title}</p>
                      <p className="text-xs text-muted-foreground">
                        👍 {game.likes} · 📥 {game.download_count} · ⭐ {game.avg_rating || 0}
                      </p>
                    </div>
                  </Link>
                ))}
                {topGames.length === 0 && (
                  <p className="text-sm text-muted-foreground">暂无数据</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
