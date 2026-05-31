'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

interface UserInfo {
  id: string;
  email: string;
  nickname: string;
  points: number;
  avatar_url: string;
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const checkUserAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/user/auth/check');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const handleLogout = async () => {
    try {
      await fetch('/api/user/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setUser(null);
    setShowUserMenu(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">Tsanaae Game</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="搜索游戏..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input w-full rounded-lg border border-border bg-secondary/50 px-10 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all"
              />
            </div>
          </form>

          {/* Nav + User */}
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href="/games/pc"
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              电脑游戏
            </Link>
            <Link
              href="/games/mobile"
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              手机游戏
            </Link>

            {user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                    {user.nickname.charAt(0)}
                  </div>
                  <span className="hidden sm:inline text-sm">{user.nickname}</span>
                  <span className="text-xs text-yellow-500 font-medium">{user.points}积分</span>
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                      <div className="px-4 py-3 border-b border-border/50">
                        <p className="text-sm font-medium text-foreground">{user.nickname}</p>
                        <p className="text-xs text-yellow-500">积分: {user.points}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-foreground hover:bg-secondary/50 transition-colors text-left"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        个人中心
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-foreground hover:bg-secondary/50 transition-colors text-left"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        每日签到
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-secondary/50 transition-colors text-left"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
