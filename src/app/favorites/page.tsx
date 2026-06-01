'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

interface FavoriteGame {
  id: string;
  title: string;
  cover_image: string | null;
  platform: string | null;
  likes: number;
  category_name: string;
  favorited_at: string;
}

export default function FavoritesPage() {
  const [games, setGames] = useState<FavoriteGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/api/user/auth/check').then(r => r.json()).then(d => {
      if (d.user) {
        setLoggedIn(true);
        fetch('/api/user/favorites').then(r => r.json()).then(data => {
          setGames(data.games || []);
        }).catch(() => {}).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, []);

  const handleUnfavorite = async (gameId: string) => {
    try {
      const res = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId }),
      });
      const data = await res.json();
      if (!data.favorited) {
        setGames(games.filter(g => g.id !== gameId));
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">请先登录查看收藏</p>
          <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">去登录</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <PageHeader title="我的收藏" breadcrumbs={[{ label: '首页', href: '/' }, { label: '我的收藏' }]} />
            <p className="text-sm text-muted-foreground mt-1">共 {games.length} 款游戏</p>
          </div>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← 返回首页</Link>
        </div>

        {games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="h-16 w-16 text-muted-foreground/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
            <p className="text-muted-foreground mb-4">还没有收藏任何游戏</p>
            <Link href="/" className="text-primary hover:underline">去发现好游戏</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {games.map((game) => (
              <div key={game.id} className="group relative rounded-xl border border-border/50 bg-card overflow-hidden hover:border-primary/30 transition-all hover:-translate-y-1">
                <Link href={`/game/${game.id}`}>
                  <div className="aspect-video overflow-hidden">
                    {game.cover_image ? (
                      <img src={game.cover_image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary">
                        <svg className="h-10 w-10 text-muted-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-foreground truncate">{game.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {game.platform && <span className="text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">{game.platform}</span>}
                      <span className="text-xs text-muted-foreground">♡ {game.likes}</span>
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleUnfavorite(game.id)}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-yellow-400 hover:bg-black/80 transition-colors"
                  title="取消收藏"
                >
                  <svg className="h-4 w-4" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
