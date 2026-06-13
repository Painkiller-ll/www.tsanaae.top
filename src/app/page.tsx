'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import AnnouncementBar from '@/components/AnnouncementBar';
import ResourceCard from '@/components/ResourceCard';
import { DEFAULT_RESOURCE_TYPES, type Resource, type ResourceCategory } from '@/lib/types';

interface CategoryGroup {
  category: ResourceCategory;
  resources: Resource[];
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 获取精选资源
    fetch('/api/resources?featured=true&limit=8').then(r => r.json()).then(d => { if (d.data) setFeatured(d.data); }).catch(() => {});
    // 获取顶级分类
    fetch('/api/resource-categories?top_level=true').then(r => r.json()).then(d => {
      const cats: ResourceCategory[] = d.data || [];
      setCategories(cats);
      // 获取各分类最新资源
      if (cats.length > 0) {
        Promise.all(
          cats.map(cat =>
            fetch(`/api/resources?type=${cat.slug}&limit=6`)
              .then(r => r.json())
              .then(d => ({ category: cat, resources: d.data || [] }))
          )
        ).then(groups => setCategoryGroups(groups));
      }
    }).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  // 获取分类的样式
  const getCategoryStyle = (cat: ResourceCategory) => {
    const defaults = DEFAULT_RESOURCE_TYPES[cat.slug];
    if (defaults) return defaults;
    return {
      label: cat.name,
      icon: cat.icon || '📁',
      color: '#6366f1',
      gradient: 'from-indigo-500 to-indigo-700',
    };
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        {/* 公告栏 */}
        <AnnouncementBar />

        {/* Hero 搜索区 */}
        <section className="py-12 md:py-20 text-center">
          <h1 className="text-3xl md:text-5xl font-bold gradient-text mb-4">
            发现你所需的一切
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mb-8 max-w-lg mx-auto">
            {categories.map(c => c.name).join(' · ')} — 一站式资源库
          </p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索你想要的资源..."
                className="w-full h-12 rounded-2xl bg-white/5 border border-border pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>
        </section>

        {/* 资源类型快捷入口 - 动态从数据库读取 */}
        <section className="mb-12">
          <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 6)}, 1fr)` }}>
            {categories.map((cat) => {
              const style = getCategoryStyle(cat);
              return (
                <Link
                  key={cat.id}
                  href={`/resources/${cat.slug}`}
                  className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:-translate-y-0.5 transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
                    style={{ background: `linear-gradient(135deg, ${style.color}33, ${style.color}11)` }}
                  >
                    {style.icon}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 精选资源 */}
        {featured.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                编辑精选
              </h2>
              <Link href="/resources/all" className="text-xs text-muted-foreground hover:text-primary transition-colors">查看全部 →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {featured.map(r => <ResourceCard key={r.id} resource={r} />)}
            </div>
          </section>
        )}

        {/* 各分类最新资源 - 动态渲染 */}
        {categoryGroups.filter(g => g.resources.length > 0).map(group => {
          const style = getCategoryStyle(group.category);
          return (
            <section key={group.category.id} className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span
                    className="w-1 h-5 rounded-full"
                    style={{ backgroundColor: style.color }}
                  />
                  最新{group.category.name}
                </h2>
                <Link href={`/resources/${group.category.slug}`} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  更多 →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {group.resources.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
