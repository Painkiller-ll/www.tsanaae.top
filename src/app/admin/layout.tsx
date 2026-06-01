'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/admin', label: '仪表盘', icon: '📊' },
  { href: '/admin/stats', label: '数据统计', icon: '📈' },
  { href: '/admin/games', label: '游戏管理', icon: '🎮' },
  { href: '/admin/collections', label: '合集管理', icon: '📚' },
  { href: '/admin/categories', label: '分类管理', icon: '📁' },
  { href: '/admin/tags', label: '标签管理', icon: '🏷️' },
  { href: '/admin/comments', label: '评论管理', icon: '💬' },
  { href: '/admin/announcements', label: '公告管理', icon: '📢' },
  { href: '/admin/shop', label: '商城管理', icon: '🛒' },
  { href: '/admin/wishlist', label: '心愿单', icon: '🌟' },
  { href: '/admin/music', label: '音乐管理', icon: '🎵' },
  { href: '/admin/faqs', label: 'FAQ管理', icon: '❓' },
  { href: '/admin/settings', label: '站点设置', icon: '⚙️' },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/check');
      const data = await res.json();
      setAuthenticated(data.authenticated);
      if (!data.authenticated && !pathname.includes('/login')) {
        router.push('/admin/login');
      }
    } catch {
      setAuthenticated(false);
      router.push('/admin/login');
    }
  }, [router, pathname]);

  useEffect(() => {
    if (pathname.includes('/login')) {
      setAuthenticated(true);
      return;
    }
    checkAuth();
  }, [pathname, checkAuth]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  if (authenticated === null && !pathname.includes('/login')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (pathname.includes('/login')) {
    return <>{children}</>;
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-16'
        } border-r border-border bg-card flex flex-col transition-all duration-200 shrink-0`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          {sidebarOpen && (
            <span className="ml-2 font-semibold text-sm gradient-text whitespace-nowrap">管理后台</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-2 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <span className="text-base shrink-0">🌐</span>
            {sidebarOpen && <span className="whitespace-nowrap">查看网站</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
          >
            <span className="text-base shrink-0">🚪</span>
            {sidebarOpen && <span className="whitespace-nowrap">退出登录</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-6 bg-card/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
