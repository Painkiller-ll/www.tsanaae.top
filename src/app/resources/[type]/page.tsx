'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import ResourceCard from '@/components/ResourceCard';
import { RESOURCE_TYPES, type Resource, type ResourceType, type ResourceCategory } from '@/lib/types';

const PAGE_SIZE = 12;

export default function ResourcesByTypePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = params.type as string;
  const typeConfig = RESOURCE_TYPES[type as ResourceType];

  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    fetch(`/api/resource-categories?type=${type}`)
      .then(r => r.json())
      .then(d => { if (d.data) setCategories(d.data.filter((c: ResourceCategory) => c.parent_id !== null)); })
      .catch(() => {});
  }, [type]);

  useEffect(() => {
    loadResources();
  }, [type, selectedCategory, sort, page]);

  const loadResources = () => {
    setLoading(true);
    const q = new URLSearchParams({
      type,
      sort,
      limit: PAGE_SIZE.toString(),
      offset: ((page - 1) * PAGE_SIZE).toString(),
    });
    if (selectedCategory) q.set('category_id', selectedCategory.toString());
    fetch(`/api/resources?${q}`)
      .then(r => r.json())
      .then(d => { setResources(d.data || []); setTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleCategoryChange = (catId: number | null) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleSortChange = (s: string) => {
    setSort(s);
    setPage(1);
  };

  if (!typeConfig) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">未知资源类型</h1>
          <a href="/" className="text-primary hover:underline">返回首页</a>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title={typeConfig.label}
          icon={typeConfig.icon}
          breadcrumbs={[{ label: '首页', href: '/' }, { label: typeConfig.label }]}
        />

        {/* 子分类筛选 */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 mb-6">
            <button
              onClick={() => handleCategoryChange(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-primary text-white'
                  : 'bg-white/5 text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              全部
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {cat.icon && <span className="mr-1">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* 排序栏 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground">共 {total} 个资源</span>
          <div className="flex gap-1">
            {[{ key: 'newest', label: '最新' }, { key: 'popular', label: '最热' }, { key: 'rating', label: '评分' }].map(s => (
              <button
                key={s.key}
                onClick={() => handleSortChange(s.key)}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  sort === s.key ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 资源网格 */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="rounded-xl bg-card border border-border animate-pulse">
                <div className="aspect-[3/4] bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : resources.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {resources.map(r => <ResourceCard key={r.id} resource={r} />)}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-border text-muted-foreground hover:text-foreground hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                
                {generatePageNumbers(page, totalPages).map((p, i) => (
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                        page === p
                          ? 'bg-primary text-white'
                          : 'bg-white/5 border border-border text-muted-foreground hover:text-foreground hover:bg-white/10'
                      }`}
                    >
                      {p}
                    </button>
                  )
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-border text-muted-foreground hover:text-foreground hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <span className="text-4xl mb-4 block">{typeConfig.icon}</span>
            <p className="text-muted-foreground">暂无{typeConfig.label}资源</p>
            <p className="text-xs text-muted-foreground/50 mt-1">管理员可在后台添加</p>
          </div>
        )}
      </main>
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  
  const pages: (number | string)[] = [1];
  
  if (current > 3) pages.push('...');
  
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  
  for (let i = start; i <= end; i++) pages.push(i);
  
  if (current < total - 2) pages.push('...');
  
  pages.push(total);
  
  return pages;
}
