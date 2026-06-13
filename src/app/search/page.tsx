'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import ResourceCard from '@/components/ResourceCard';
import { RESOURCE_TYPES, type Resource, type ResourceType } from '@/lib/types';
import { Suspense } from 'react';

const PAGE_SIZE = 12;

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    fetch(`/api/search?q=${encodeURIComponent(q)}&type=${typeFilter}&limit=${PAGE_SIZE}&offset=${offset}`)
      .then(r => r.json())
      .then(d => { setResources(d.data || []); setTotal(d.total || d.data?.length || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, typeFilter, page]);

  const handleTypeChange = (t: string) => {
    setTypeFilter(t);
    setPage(1);
  };

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
            onClick={() => handleTypeChange('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground border border-border'}`}
          >
            全部
          </button>
          {(Object.entries(RESOURCE_TYPES) as [ResourceType, typeof RESOURCE_TYPES[ResourceType]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => handleTypeChange(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === key ? 'text-white' : 'bg-white/5 text-muted-foreground border border-border'}`}
              style={typeFilter === key ? { backgroundColor: config.color } : {}}
            >
              {config.icon} {config.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground mb-4 block">共找到 {total} 个结果</span>

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
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${page === p ? 'bg-primary text-white' : 'bg-white/5 border border-border text-muted-foreground hover:text-foreground'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  下一页
                </button>
              </div>
            )}
          </>
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
