'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { useParams } from 'next/navigation';
import { Game } from '@/lib/types';
import Header from '@/components/Header';
import GameCard from '@/components/GameCard';

interface CategoryInfo {
  id: number;
  name: string;
  slug: string;
  resource_type: string;
  icon: string;
  sort_order: number;
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null);

  useEffect(() => {
    // 先获取分类信息
    fetch('/api/categories')
      .then(async (res) => { const t = await res.text(); return t ? JSON.parse(t) : null; })
      .then((data) => {
        if (data?.categories) {
          const cat = data.categories.find((c: CategoryInfo) => c.slug === slug);
          if (cat) setCategoryInfo(cat);
        }
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    // 使用 slug 作为 resource_type 查询
    fetch(`/api/games?category=cat-${slug}&limit=50`)
      .then(async (res) => { const t = await res.text(); return t ? JSON.parse(t) : null; })
      .then((data) => {
        if (data?.games) setGames(data.games);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const title = categoryInfo?.name || slug;
  const icon = categoryInfo?.icon || '📁';

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader 
          title={title} 
          description={`${title}相关资源`} 
          breadcrumbs={[{ label: '首页', href: '/' }, { label: title }]} 
        />

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
            <p className="text-muted-foreground">暂无资源</p>
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
