'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: '仪表盘', icon: '📊' },
  { href: '/admin/resources', label: '资源管理', icon: '📦' },
  { href: '/admin/resource-categories', label: '分类管理', icon: '📂' },
  { href: '/admin/tags', label: '标签管理', icon: '🏷️' },
  { href: '/admin/announcements', label: '公告管理', icon: '📢' },
  { href: '/admin/faqs', label: 'FAQ管理', icon: '❓' },
  { href: '/admin/music', label: '音乐管理', icon: '🎵' },
  { href: '/admin/shop', label: '积分商城', icon: '🛒' },
  { href: '/admin/settings', label: '站点设置', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [checked, setChecked] = useState(false);

  // 检查登录状态
  useEffect(() => {
    if (pathname !== '/admin/login') {
      fetch('/api/admin/check', { credentials: 'include' }).then(res => {
        if (!res.ok) router.push('/admin/login');
        else setChecked(true);
      }).catch(() => router.push('/admin/login'));
      return;
    }
    setChecked(true);
  }, [pathname, router]);

  // 登录页不显示侧边栏
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!checked) {
    return <div className="min-h-screen flex items-center justify-center">检查登录状态...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && <span className="font-bold text-gray-800 text-lg">管理后台</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500 hover:text-gray-700 p-1">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* 导航 */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors text-sm ${
                  isActive
                    ? 'bg-violet-50 text-violet-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 底部操作 */}
        <div className="border-t border-gray-200 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm"
          >
            <span>🌐</span>
            {sidebarOpen && <span>查看网站</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm w-full"
          >
            <span>🚪</span>
            {sidebarOpen && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
