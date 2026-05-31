'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Game {
  id: string;
  title: string;
  slug?: string;
  cover_image?: string;
  category_id: string;
  platform: string;
  likes: number;
  is_featured: boolean;
  created_at: string;
  categories?: { id: string; name: string; slug: string };
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadGames = async () => {
    try {
      const res = await fetch('/api/admin/games');
      const data = await res.json();
      setGames(data.games || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定删除游戏「${title}」吗？此操作不可撤销。`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
      setGames(games.filter((g) => g.id !== id));
    } catch {
      alert('删除失败，请重试');
    } finally {
      setDeleting(null);
    }
  };

  const toggleFeatured = async (game: Game) => {
    try {
      await fetch(`/api/admin/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !game.is_featured }),
      });
      setGames(games.map((g) => (g.id === game.id ? { ...g, is_featured: !g.is_featured } : g)));
    } catch {
      alert('操作失败，请重试');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">游戏管理</h1>
        <Link
          href="/admin/games/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + 添加游戏
        </Link>
      </div>

      {loading ? (
        <div className="text-muted-foreground">加载中...</div>
      ) : games.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">暂无游戏</p>
          <p className="text-sm">点击上方按钮添加第一个游戏</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">游戏</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">分类</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">平台</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">点赞</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">精选</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {game.cover_image ? (
                          <img
                            src={game.cover_image}
                            alt={game.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            N/A
                          </div>
                        )}
                        <span className="font-medium text-foreground">{game.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {game.categories?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                        {game.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{game.likes}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleFeatured(game)}
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs transition-colors ${
                          game.is_featured
                            ? 'bg-yellow-500/10 text-yellow-400'
                            : 'bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {game.is_featured ? '★ 精选' : '☆ 普通'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/games/${game.id}/edit`}
                          className="px-3 py-1 rounded text-xs bg-muted text-foreground hover:bg-muted/80 transition-colors"
                        >
                          编辑
                        </Link>
                        <button
                          onClick={() => handleDelete(game.id, game.title)}
                          disabled={deleting === game.id}
                          className="px-3 py-1 rounded text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                        >
                          {deleting === game.id ? '删除中...' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
