'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import ResourceCard from '@/components/ResourceCard';
import { RESOURCE_TYPES, type Resource, type ResourceType } from '@/lib/types';
import { Suspense } from 'react';

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}&type=${typeFilter}`)
      .then(r => r.json())
      .then(d => setResources(d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, typeFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title={`搜索：${q}`}
          breadcrumbs={[{ label: '首页', href: '/' }, { label: '搜索结果' }]}
        />

        {/* 类型筛选 */}
        <div className="flex flex-wrap gap-2 mt-4 mb-6">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground border border-border'}`}
          >
            全部
          </button>
          {(Object.entries(RESOURCE_TYPES) as [ResourceType, typeof RESOURCE_TYPES[ResourceType]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === key ? 'text-white' : 'bg-white/5 text-muted-foreground border border-border'}`}
              style={typeFilter === key ? { backgroundColor: config.color } : {}}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card border border-border animate-pulse">
                <div className="aspect-[3/4] bg-white/5" />
                <div className="p-3 space-y-2"><div className="h-4 bg-white/5 rounded w-3/4" /></div>
              </div>
            ))}
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">未找到相关资源</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SearchContent />
    </Suspense>
  );
}
