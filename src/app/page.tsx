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

/** 动态颜色调色板 - 新分类自动循环分配 */
const COLOR_PALETTE: CategoryStyle[] = [
  { gradient: 'from-blue-500 to-blue-700',     bgLight: 'bg-blue-50 dark:bg-blue-500/10',   border: 'border-blue-200 dark:border-blue-500/20',   text: 'text-blue-600 dark:text-blue-400',   icon: '📚' },
  { gradient: 'from-red-500 to-red-700',       bgLight: 'bg-red-50 dark:bg-red-500/10',     border: 'border-red-200 dark:border-red-500/20',     text: 'text-red-600 dark:text-red-400',     icon: '🎬' },
  { gradient: 'from-pink-500 to-pink-700',     bgLight: 'bg-pink-50 dark:bg-pink-500/10',   border: 'border-pink-200 dark:border-pink-500/20',   text: 'text-pink-600 dark:text-pink-400',   icon: '🎵' },
  { gradient: 'from-purple-500 to-purple-700', bgLight: 'bg-purple-50 dark:bg-purple-500/10',border: 'border-purple-200 dark:border-purple-500/20',text: 'text-purple-600 dark:text-purple-400',icon: '🎮' },
  { gradient: 'from-emerald-500 to-emerald-700',bgLight:'bg-emerald-50 dark:bg-emerald-500/10',border:'border-emerald-200 dark:border-emerald-500/20',text:'text-emerald-600 dark:text-emerald-400',icon: '📖' },
  { gradient: 'from-amber-500 to-amber-700',   bgLight: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', icon: '💻' },
  { gradient: 'from-cyan-500 to-cyan-700',     bgLight: 'bg-cyan-50 dark:bg-cyan-500/10',   border: 'border-cyan-200 dark:border-cyan-500/20',   text: 'text-cyan-600 dark:text-cyan-400',   icon: '🔮' },
  { gradient: 'from-rose-500 to-rose-700',     bgLight: 'bg-rose-50 dark:bg-rose-500/10',   border: 'border-rose-200 dark:border-rose-500/20',   text: 'text-rose-600 dark:text-rose-400',   icon: '💎' },
  { gradient: 'from-teal-500 to-teal-700',     bgLight: 'bg-teal-50 dark:bg-teal-500/10',   border: 'border-teal-200 dark:border-teal-500/20',   text: 'text-teal-600 dark:text-teal-400',   icon: '🌿' },
  { gradient: 'from-orange-500 to-orange-700', bgLight: 'bg-orange-50 dark:bg-orange-500/10',border: 'border-orange-200 dark:border-orange-500/20',text: 'text-orange-600 dark:text-orange-400',icon: '🔥' },
];

/** 兼容旧 slug 的映射（已有的旧分类保留原配色） */
const LEGACY_STYLES: Record<string, CategoryStyle> = {
  study:    COLOR_PALETTE[0],
  movie:    COLOR_PALETTE[1],
  music:    COLOR_PALETTE[2],
  game:     COLOR_PALETTE[3],
  novel:    COLOR_PALETTE[4],
  software: COLOR_PALETTE[5],
};

/** 根据 sort_order 获取分类样式 */
function getCategoryStyle(cat: ResourceCategory, index: number): CategoryStyle {
  // 优先用旧映射（已有分类保持配色不变）
  if (LEGACY_STYLES[cat.slug]) return LEGACY_STYLES[cat.slug];
  // 否则从调色板循环取色
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

/** 分类网格 - 超过一行时支持折叠/展开 */
function CategoryGrid({ categories, resourcesByType }: {
  categories: ResourceCategory[];
  resourcesByType: Record<string, Resource[]>;
}) {
  const [expanded, setExpanded] = useState(false);

  // 推荐卡片 + 分类卡片
  type CategoryItem = { id: string; isPromo: true } | { id: string; isPromo: false; cat: ResourceCategory };
  const allItems: CategoryItem[] = [
    { id: '__promo__', isPromo: true },
    ...categories.map(cat => ({ id: String(cat.id), isPromo: false as const, cat })),
  ];

  // 每行最多显示数：手机2列、平板3列、桌面6列
  // 折叠时只显示第一行的数量（取最大值6，确保各端第一行都完整）
  const ROW_SIZE = 6;
  const needsCollapse = allItems.length > ROW_SIZE;
  const visibleItems = expanded ? allItems : allItems.slice(0, ROW_SIZE);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {visibleItems.map(item => {
          if (item.isPromo) {
            return (
              <Link
                key={item.id}
                href="/recommend"
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 sm:p-5 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-0 group-hover:opacity-15 transition-opacity" />
                <div className="relative z-10 flex flex-col items-center text-center gap-1 sm:gap-2">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <span className="font-bold text-sm sm:text-base text-amber-400">推荐</span>
                  <span className="text-[10px] sm:text-xs text-amber-400/60">精选推荐</span>
                </div>
              </Link>
            );
          }
          const cat = (item as { isPromo: false; cat: ResourceCategory }).cat;
          const catIndex = categories.indexOf(cat);
          const style = getCategoryStyle(cat, catIndex);
          const icon = cat.icon || style.icon;
          return (
            <Link
              key={item.id}
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
      {needsCollapse && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs sm:text-sm text-muted-foreground hover:text-foreground border border-border/50 hover:border-border bg-card/50 hover:bg-card transition-all"
          >
            {expanded ? (
              <>收起 <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg></>
            ) : (
              <>查看更多分类 <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([]);
  const [siteDesc, setSiteDesc] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/resource-categories?top_level=true').then(r => r.json()).then(d => {
        if (d.data) {
          setCategories(d.data);
        }
      }),
      fetch('/api/resources?is_featured=true&limit=12&is_published=true')
        .then(r => r.json())
        .then(d => { if (d.data) setFeaturedResources(d.data); })
        .catch(() => {}),
      fetch('/api/site-settings')
        .then(r => r.json())
        .then(d => {
          if (d.site_description) setSiteDesc(d.site_description);
          setSettings(d);
        }),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">加载中...</span>
            </div>
          </div>
        ) : (
          <>
            <AnnouncementBar />

            {/* 站点描述 */}
            {siteDesc && (
              <section className="mb-6 sm:mb-8 text-center">
                <p className="text-muted-foreground text-sm sm:text-base">{siteDesc}</p>
              </section>
            )}

            {/* 分类入口 - 可折叠 */}
            <section className="mb-6 sm:mb-8">
              <CategoryGrid categories={categories} resourcesByType={{}} />
            </section>

            {/* 投稿资源入口 - 手机端/平板端可见，桌面端隐藏 */}
            <div className="md:hidden mb-6 mt-4">
              <a
                href="/submit"
                className="flex items-center justify-center gap-2 w-full sm:w-auto sm:inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 px-6 py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                投稿资源
              </a>
            </div>

            {/* 精选资源 */}
            <section className="mb-6 sm:mb-10">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  <h2 className="text-base sm:text-xl font-bold text-foreground">精选资源</h2>
                </div>
              </div>
              {featuredResources.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  {featuredResources.map(r => <ResourceCard key={r.id} resource={r} />)}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  暂无精选资源，敬请期待
                </div>
              )}
            </section>

            {/* 关于/联系方式 */}
            {(settings.about_text || settings.contact_qq || settings.contact_wechat || settings.contact_email || settings.contact_telegram || settings.contact_github) && (
              <section className="mb-6 sm:mb-10 mt-6 sm:mt-10 rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-foreground mb-3">关于本站</h2>
                {settings.about_text && <p className="text-sm text-muted-foreground mb-4">{settings.about_text}</p>}
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {settings.contact_qq && (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground select-none" style={{pointerEvents:'auto'}}>
                      <span>💬</span> QQ: <span className="select-text" x-apple-data-detectors="false" style={{pointerEvents:'none'}}>{settings.contact_qq}</span>
                    </span>
                  )}
                  {settings.contact_wechat && (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                      <span>📱</span> 微信: {settings.contact_wechat}
                    </span>
                  )}
                  {settings.contact_email && (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                      <span>📧</span> {settings.contact_email}
                    </span>
                  )}
                  {settings.contact_telegram && (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                      <span>✈️</span> Telegram: {settings.contact_telegram}
                    </span>
                  )}
                  {settings.contact_github && (
                    <span className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                      <span>🐙</span> GitHub: {settings.contact_github}
                    </span>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
