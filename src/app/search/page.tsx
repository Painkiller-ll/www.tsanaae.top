'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useSearchParams } from 'next/navigation';
import { Game } from '@/lib/types';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import Link from 'next/link';
import { Suspense } from 'react';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (tag) params.set('tag', tag);

    fetch(`/api/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.games) setGames(data.games);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 记录搜索日志（用于热门搜索词统计）
    if (q && q.trim().length >= 2) {
      fetch('/api/search/hot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: q.trim() }),
      }).catch(() => {});
    }
  }, [q, tag]);

  const searchTitle = q || tag || '';

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <PageHeader
          title={tag ? `标签: ${tag}` : `搜索: ${q}`}
          description={`找到 ${games.length} 个结果`}
          breadcrumbs={[{ label: '首页', href: '/' }, { label: '搜索' }]}
        />

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
                <div className="aspect-[16/9] bg-secondary animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 w-2/3 bg-secondary rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-muted-foreground/20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p className="text-muted-foreground mb-2">未找到相关游戏</p>
            <Link href="/" className="text-primary hover:underline text-sm">返回首页</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">加载中...</div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
