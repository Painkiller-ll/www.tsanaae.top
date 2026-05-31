'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import GameGrid from '@/components/GameGrid';
import HotTags from '@/components/HotTags';

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

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          setSettings(data.settings);
          // Apply dynamic styles
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
  }, []);

  const siteName = settings?.site_name || 'Tsanaae Game';
  const siteDesc = settings?.site_description || '精选优质游戏资源，发现你的下一款游戏';
  const footerText = settings?.site_footer_text || '© 2025 Tsanaae Game. 精选优质游戏资源导航';

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-10 text-center py-8">
          <h1 className="text-4xl sm:text-5xl font-bold gradient-text mb-4">
            {siteName}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {siteDesc}
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
        <section className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Link
              href="/games/pc"
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:bg-card/80 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                🖥️
              </div>
              <div>
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">电脑游戏</div>
                <div className="text-xs text-muted-foreground">精选PC游戏资源</div>
              </div>
            </Link>
            <Link
              href="/games/mobile"
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:bg-card/80 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                📱
              </div>
              <div>
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">手机游戏</div>
                <div className="text-xs text-muted-foreground">精选手机游戏资源</div>
              </div>
            </Link>
            <Link
              href="/games/web"
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 hover:bg-card/80 transition-all group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                🌐
              </div>
              <div>
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">网页游戏</div>
                <div className="text-xs text-muted-foreground">即开即玩不下载</div>
              </div>
            </Link>
          </div>
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

      {/* Footer */}
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
            <p className="text-xs text-muted-foreground">
              {footerText}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
