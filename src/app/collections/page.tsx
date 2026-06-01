'use client';import PageHeader from '@/components/PageHeader';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { Collection } from '@/lib/types';
import GameCard from '@/components/GameCard';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/collections')
      .then(res => res.json())
      .then(data => {
        setCollections(data.collections || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="游戏合集" breadcrumbs={[{ label: '首页', href: '/' }, { label: '游戏合集' }]} />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-muted-foreground">暂无合集，敬请期待</p>
          </div>
        ) : (
          <div className="space-y-8">
            {collections.map((collection) => (
              <div key={collection.id} className="rounded-2xl border border-border/50 bg-card overflow-hidden">
                {/* 合集头部 */}
                <div className="p-6 border-b border-border/30">
                  <div className="flex items-center gap-4">
                    {collection.cover_image && (
                      <img
                        src={collection.cover_image}
                        alt={collection.title}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{collection.title}</h2>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground mt-1">{collection.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 合集中的游戏 */}
                {collection.games && collection.games.length > 0 ? (
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {collection.games.map((game) => (
                      <GameCard key={game.id} game={game} />
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground text-sm">暂无游戏</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 返回首页 */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← 返回首页
          </Link>
        </div>
      </main>
    </div>
  );
}
