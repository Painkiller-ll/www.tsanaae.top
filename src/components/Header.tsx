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
                  <span className="text-xs text-yellow-500 font-medium">{user.points}分</span>
                </button>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block w-full px-4 py-3 text-sm text-foreground hover:bg-secondary/50 transition-colors text-left"
                      >
                        个人中心
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full px-4 py-3 text-sm text-red-400 hover:bg-secondary/50 transition-colors text-left"
                      >
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
