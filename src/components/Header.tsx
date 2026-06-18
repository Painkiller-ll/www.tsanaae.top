'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { type ResourceCategory } from '@/lib/types';
import { useTheme } from '@/components/ThemeProvider';

interface HeaderProps {
  onOpenAuth?: () => void;
}

interface SiteInfo {
  site_name: string;
  site_logo_url?: string;
}

export default function Header({ onOpenAuth }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; username: string; points: number; level: number } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/site-settings').then(r => r.json()).then(d => { setSiteInfo(d.data || d); }).catch(() => {});
    // 从API获取顶级分类
    fetch('/api/resource-categories?top_level=true').then(r => r.json()).then(d => {
      if (d.data && d.data.length > 0) setCategories(d.data);
    }).catch(() => {});
    const token = localStorage.getItem('user_token');
    if (token) {
      fetch('/api/user/profile', { headers: { 'x-session': token } }).then(r => r.json()).then(d => { if (d.data) setUser(d.data); }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('user_token');
    setUser(null);
    setUserMenuOpen(false);
    window.location.reload();
  };

  const siteName = siteInfo?.site_name || 'Tsanaae';
  const siteLogoUrl = siteInfo?.site_logo_url;

  // 获取分类的图标 - 完全动态，不依赖硬编码
  const getCategoryIcon = (cat: ResourceCategory) => {
    return cat.icon || '📁';
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt={siteName} className="h-7 w-7 rounded-lg object-cover" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            )}
            <span className="text-base font-bold gradient-text hidden sm:inline">{siteName}</span>
          </Link>

          {/* 资源类型导航 - 从数据库动态读取 */}
          <nav className="hidden lg:flex items-center gap-1">
            {categories.map((cat) => {
              const icon = getCategoryIcon(cat);
              return (
                <Link
                  key={cat.id}
                  href={`/resources/${cat.slug}`}
                  className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1.5"
                >
                  <span>{icon}</span>
                  <span>{cat.name}</span>
                </Link>
              );
            })}
            <Link
              href="/recommend"
              className="px-3 py-1.5 text-sm text-amber-400 hover:text-amber-300 rounded-lg hover:bg-amber-500/10 transition-colors flex items-center gap-1.5 font-semibold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>推荐</span>
            </Link>
            <Link
              href="/submit"
              className="md:hidden px-3 py-1.5 text-sm text-purple-400 hover:text-purple-300 rounded-lg hover:bg-purple-500/10 transition-colors flex items-center gap-1.5 font-medium"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span>投稿</span>
            </Link>
          </nav>

          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索资源..."
                className="w-full h-8 rounded-full bg-white/5 border border-border pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* 右侧操作 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 主题切换 */}
            <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors" title={theme === 'dark' ? '切换亮色' : '切换暗色'}>
              {theme === 'dark' ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            {/* 手机端推荐入口 */}
            <Link href="/recommend" className="lg:hidden p-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors" title="推荐">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </Link>
            {/* 手机端搜索 */}
            <button onClick={() => { const q = prompt('搜索资源:'); if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`; }} className="sm:hidden p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>

            {/* 用户 */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                    {(user.username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden md:inline text-sm text-foreground">{user.username}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-card border border-border shadow-xl py-1 z-50">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user.username}</p>
                      <p className="text-xs text-muted-foreground">Lv.{user.level} · {user.points}积分</p>
                    </div>
                    <Link href="/profile" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">个人中心</Link>
                    <Link href="/favorites" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">我的收藏</Link>
                    <Link href="/shop" className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">积分商城</Link>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5">退出登录</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                登录
              </Link>
            )}

            {/* 手机端菜单 */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* 手机端下拉菜单 */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border py-2 space-y-1">
            {categories.map((cat) => {
              const icon = getCategoryIcon(cat);
              return (
                <Link
                  key={cat.id}
                  href={`/resources/${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5"
                >
                  <span>{icon}</span>
                  <span>{cat.name}</span>
                </Link>
              );
            })}
            <Link
              href="/recommend"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 hover:text-amber-300 rounded-lg hover:bg-amber-500/10 font-semibold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>推荐</span>
            </Link>
            <div className="border-t border-border my-1" />
            <Link
              href="/submit"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:text-green-300 rounded-lg hover:bg-green-500/10 font-semibold"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>投稿资源</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
