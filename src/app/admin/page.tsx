'use client';

import { useEffect, useState } from 'react';

interface Stats {
  gameCount: number;
  categoryCount: number;
  tagCount: number;
  commentCount: number;
  featuredCount: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [gamesRes, catsRes, tagsRes, commentsRes] = await Promise.all([
          fetch('/api/admin/games'),
          fetch('/api/admin/categories'),
          fetch('/api/admin/tags'),
          fetch('/api/admin/comments'),
        ]);

        const [gamesData, catsData, tagsData, commentsData] = await Promise.all([
          gamesRes.json(),
          catsRes.json(),
          tagsRes.json(),
          commentsRes.json(),
        ]);

        setStats({
          gameCount: gamesData.games?.length || 0,
          categoryCount: catsData.categories?.length || 0,
          tagCount: tagsData.tags?.length || 0,
          commentCount: commentsData.comments?.length || 0,
          featuredCount: gamesData.games?.filter((g: { is_featured: boolean }) => g.is_featured).length || 0,
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = stats
    ? [
        { label: '游戏总数', value: stats.gameCount, icon: '🎮', color: 'text-purple-400' },
        { label: '精选推荐', value: stats.featuredCount, icon: '⭐', color: 'text-yellow-400' },
        { label: '分类数', value: stats.categoryCount, icon: '📁', color: 'text-blue-400' },
        { label: '标签数', value: stats.tagCount, icon: '🏷️', color: 'text-green-400' },
        { label: '评论数', value: stats.commentCount, icon: '💬', color: 'text-pink-400' },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">仪表盘</h1>

      {loading ? (
        <div className="text-muted-foreground">加载中...</div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{card.icon}</span>
                  <span className="text-sm text-muted-foreground">{card.label}</span>
                </div>
                <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">快捷操作</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <a
                href="/admin/games"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:border-primary/30 hover:bg-muted transition-colors"
              >
                <span>🎮</span> 管理游戏
              </a>
              <a
                href="/admin/categories"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:border-primary/30 hover:bg-muted transition-colors"
              >
                <span>📁</span> 管理分类
              </a>
              <a
                href="/admin/tags"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:border-primary/30 hover:bg-muted transition-colors"
              >
                <span>🏷️</span> 管理标签
              </a>
              <a
                href="/admin/comments"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground hover:border-primary/30 hover:bg-muted transition-colors"
              >
                <span>💬</span> 审核评论
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
