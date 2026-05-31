'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Game, GameTag } from '@/lib/types';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';
import Link from 'next/link';

const SLUG_TO_CATEGORY: Record<string, string> = {
  pc: 'cat-pc',
  mobile: 'cat-mobile',
  web: 'cat-web',
};

const SLUG_TO_TITLE: Record<string, string> = {
  pc: '电脑游戏',
  mobile: '手机游戏',
  web: '网页游戏',
};

const SLUG_TO_DESC: Record<string, string> = {
  pc: '精选优质电脑游戏资源',
  mobile: '精选优质手机游戏资源',
  web: '精选优质网页游戏资源',
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [games, setGames] = useState<Game[]>([]);
  const [tags, setTags] = useState<GameTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const categoryId = SLUG_TO_CATEGORY[slug] || '';
  const title = SLUG_TO_TITLE[slug] || '游戏';
  const description = SLUG_TO_DESC[slug] || '';

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => {
        if (data.tags) setTags(data.tags);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    setLoading(true);
    const url = selectedTag
      ? `/api/games?category=${categoryId}&tag=${selectedTag}&limit=50`
      : `/api/games?category=${categoryId}&limit=50`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.games) setGames(data.games);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId, selectedTag]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">首页</Link>
          <span>/</span>
          <span className="text-foreground">{title}</span>
        </nav>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        {/* Tag Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('')}
              className={`tag-pill ${!selectedTag ? '!bg-primary/30 !border-primary/50' : ''}`}
            >
              全部
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                className={`tag-pill ${selectedTag === tag.id ? '!bg-primary/30 !border-primary/50' : ''}`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
            <p className="text-muted-foreground">暂无游戏数据</p>
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
