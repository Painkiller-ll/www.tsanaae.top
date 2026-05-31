'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import GameGrid from '@/components/GameGrid';
import HotTags from '@/components/HotTags';
import AnnouncementBar from '@/components/AnnouncementBar';
import { Game, Collection } from '@/lib/types';

interface UserInfo {
  id: string;
  email: string;
  nickname: string;
  points: number;
  avatar_url: string;
}

interface SiteSettings {
  site_name: string;
  site_description: string;
  site_bg_color: string;
  site_card_color: string;
  site_accent_color: string;
  site_logo_url: string;
  site_bg_image: string;
  site_footer_text: string;
}

export default function Home() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    // Load site settings
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings);
          const root = document.documentElement;
          if (data.settings.site_bg_color) {
            root.style.setProperty('--bg-primary', data.settings.site_bg_color);
            document.body.style.backgroundColor = data.settings.site_bg_color;
          }
          if (data.settings.site_accent_color) {
            root.style.setProperty('--color-primary', data.settings.site_accent_color);
          }
          if (data.settings.site_bg_image) {
            document.body.style.backgroundImage = `url(${data.settings.site_bg_image})`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundAttachment = 'fixed';
          }
        }
      })
      .catch(() => {});

    // Check user auth
    fetch('/api/user/auth/check')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      <AnnouncementBar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-10 text-center py-8">
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-4">
            {settings?.site_name || 'Tsanaae Game'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {settings?.site_description || '精选优质游戏资源，发现你的下一款游戏'}
          </p>
        </section>

        {/* Hot Tags */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">热门搜索</h2>
          </div>
          <HotTags />
        </section>

        {/* Category Navigation */}
        <CategoryNav />

        {/* User Actions Banner */}
        {!user ? <UserBanner /> : <LoggedInBanner user={user} />}

        {/* Featured Games / 编辑精选 */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span>⭐</span> 编辑精选
            </h2>
          </div>
          <FeaturedGames />
        </section>

        {/* Collections / 游戏合集入口 */}
        <section className="mb-10">
          <CollectionPreview />
        </section>

        {/* Latest Games */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <span>🔥</span> 最新发布
            </h2>
          </div>
          <GameGrid />
        </section>
      </main>

      <FooterSection siteName={settings?.site_name || 'Tsanaae Game'} footerText={settings?.site_footer_text || '© 2025 Tsanaae Game. 精选优质游戏资源导航'} />
    </div>
  );
}

// Sub-components
function CategoryNav() {
  return (
    <section className="mb-10">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { href: '/games/pc', icon: '🖥️', name: '电脑游戏', desc: '精选PC游戏资源' },
          { href: '/games/mobile', icon: '📱', name: '手机游戏', desc: '精选手机游戏资源' },
          { href: '/games/web', icon: '🌐', name: '网页游戏', desc: '即开即玩不下载' },
        ].map(cat => (
          <Link
            key={cat.href}
            href={cat.href}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:bg-card/80 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
              {cat.icon}
            </div>
            <div>
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{cat.name}</div>
              <div className="text-xs text-muted-foreground">{cat.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function UserBanner() {
  return (
    <section className="mb-10">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-1">加入 Tsanaae Game 社区</h3>
          <p className="text-sm text-muted-foreground">注册账号即可每日签到赚积分，解锁更多游戏资源</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/register" className="rounded-xl px-6 py-2.5 text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors">
            免费注册
          </Link>
          <Link href="/login" className="rounded-xl px-6 py-2.5 text-sm font-medium text-foreground border border-border hover:bg-secondary/50 transition-colors">
            已有账号？登录
          </Link>
        </div>
      </div>
    </section>
  );
}

function LoggedInBanner({ user }: { user: UserInfo }) {
  return (
    <section className="mb-10">
      <div className="rounded-2xl border border-border/50 bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary text-lg font-bold">
              {user.nickname.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-foreground">{user.nickname}</p>
              <p className="text-sm text-yellow-500">积分: {user.points}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile" className="rounded-xl px-5 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors">
              每日签到
            </Link>
            <Link href="/profile" className="rounded-xl px-5 py-2 text-sm font-medium text-foreground border border-border hover:bg-secondary/50 transition-colors">
              个人中心
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedGames() {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    fetch('/api/games?featured=true&limit=4')
      .then(res => res.json())
      .then(data => setGames(data.games || []))
      .catch(() => {});
  }, []);

  if (games.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {games.map((game) => (
        <Link
          key={game.id}
          href={`/game/${game.id}`}
          className="group relative rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-primary/30 transition-all"
        >
          <div className="aspect-video relative overflow-hidden">
            {game.cover_image && (
              <img
                src={game.cover_image}
                alt={game.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <h3 className="text-sm font-bold text-white truncate">{game.title}</h3>
              <p className="text-xs text-white/60 mt-0.5">
                👍 {game.likes} · ⭐ {game.avg_rating || '-'}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CollectionPreview() {
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    fetch('/api/collections')
      .then(res => res.json())
      .then(data => setCollections((data.collections || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  if (collections.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <span>📚</span> 游戏合集
        </h2>
        <Link href="/collections" className="text-sm text-primary hover:underline">查看全部 →</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {collections.map((col) => (
          <div
            key={col.id}
            className="rounded-2xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-all cursor-pointer group"
            onClick={() => window.location.href = `/collections`}
          >
            <div className="flex items-center gap-3">
              {col.cover_image ? (
                <img src={col.cover_image} alt="" className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl">📚</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{col.title}</p>
                <p className="text-xs text-muted-foreground">{col.games?.length || 0} 款游戏</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterSection({ siteName, footerText }: { siteName: string; footerText: string }) {
  return (
    <footer className="border-t border-border/50 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="text-sm font-semibold gradient-text">{siteName}</span>
          </div>
          <p className="text-xs text-muted-foreground">{footerText}</p>
        </div>
      </div>
    </footer>
  );
}
