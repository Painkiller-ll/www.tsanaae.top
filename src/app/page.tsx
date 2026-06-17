'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import AnnouncementBar from '@/components/AnnouncementBar';
import ResourceCard from '@/components/ResourceCard';
import { ResourceCategory, Resource } from '@/lib/types';

interface CategoryStyle {
  gradient: string;
  bgLight: string;
  border: string;
  text: string;
  icon: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  study:    { gradient: 'from-blue-500 to-blue-700',   bgLight: 'bg-blue-50 dark:bg-blue-500/10',  border: 'border-blue-200 dark:border-blue-500/20',  text: 'text-blue-600 dark:text-blue-400',  icon: '📚' },
  movie:    { gradient: 'from-red-500 to-red-700',     bgLight: 'bg-red-50 dark:bg-red-500/10',    border: 'border-red-200 dark:border-red-500/20',    text: 'text-red-600 dark:text-red-400',    icon: '🎬' },
  music:    { gradient: 'from-pink-500 to-pink-700',   bgLight: 'bg-pink-50 dark:bg-pink-500/10',  border: 'border-pink-200 dark:border-pink-500/20',  text: 'text-pink-600 dark:text-pink-400',  icon: '🎵' },
  game:     { gradient: 'from-purple-500 to-purple-700',bgLight:'bg-purple-50 dark:bg-purple-500/10',border:'border-purple-200 dark:border-purple-500/20',text:'text-purple-600 dark:text-purple-400',icon: '🎮' },
  novel:    { gradient: 'from-emerald-500 to-emerald-700',bgLight:'bg-emerald-50 dark:bg-emerald-500/10',border:'border-emerald-200 dark:border-emerald-500/20',text:'text-emerald-600 dark:text-emerald-400',icon: '📖' },
  software: { gradient: 'from-amber-500 to-amber-700', bgLight: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20',  text: 'text-amber-600 dark:text-amber-400', icon: '💻' },
};

const DEFAULT_STYLE: CategoryStyle = {
  gradient: 'from-gray-500 to-gray-700', bgLight: 'bg-gray-50 dark:bg-gray-500/10',
  border: 'border-gray-200 dark:border-gray-500/20', text: 'text-gray-600 dark:text-gray-400', icon: '📁',
};

export default function HomePage() {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [resourcesByType, setResourcesByType] = useState<Record<string, Resource[]>>({});

  useEffect(() => {
    fetch('/api/resource-categories?top_level=true')
      .then(r => r.json())
      .then(d => { if (d.data) setCategories(d.data); })
      .catch(() => {});

    const types = ['study', 'movie', 'music', 'game', 'novel', 'software'];
    types.forEach(type => {
      fetch(`/api/resources?type=${type}&limit=8&is_published=true`)
        .then(r => r.json())
        .then(d => { if (d.data) setResourcesByType(prev => ({ ...prev, [type]: d.data })); })
        .catch(() => {});
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <AnnouncementBar />

        {/* 6大分类入口 - 移动端2列，平板3列，桌面6列 */}
        <section className="mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {categories.map(cat => {
              const style = CATEGORY_STYLES[cat.slug] || DEFAULT_STYLE;
              const icon = cat.icon || style.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/resources/${cat.slug}`}
                  className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border ${style.border} ${style.bgLight} p-3 sm:p-5 transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <div className="relative z-10 flex flex-col items-center text-center gap-1 sm:gap-2">
                    <span className="text-2xl sm:text-4xl">{icon}</span>
                    <span className={`font-bold text-sm sm:text-base ${style.text}`}>{cat.name}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">
                      {(resourcesByType[cat.slug] || []).length > 0
                        ? `${resourcesByType[cat.slug]?.length || 0}+ 资源`
                        : '敬请期待'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 各分类最新资源 */}
        {categories.map(cat => {
          const resources = resourcesByType[cat.slug];
          if (!resources || resources.length === 0) return null;
          const style = CATEGORY_STYLES[cat.slug] || DEFAULT_STYLE;

          return (
            <section key={cat.id} className="mb-6 sm:mb-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl">{cat.icon || style.icon}</span>
                  <h2 className="text-base sm:text-xl font-bold text-foreground">{cat.name}</h2>
                </div>
                <Link
                  href={`/resources/${cat.slug}`}
                  className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  查看全部
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
              {/* 移动端2列，平板3列，桌面4列 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
