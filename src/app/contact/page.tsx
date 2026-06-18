'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface SiteSettings {
  site_name: string;
  contact_qq: string;
  contact_wechat: string;
  contact_email: string;
  contact_telegram: string;
  contact_github: string;
  wechat_qr_code: string;
  about_text: string;
}

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(async (res) => {
        const text = await res.text();
        try { return JSON.parse(text); } catch { return null; }
      })
      .then(data => { if (data) setSettings(data); })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">联系我们</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 联系方式卡片 */}
          <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-lg font-semibold mb-4">联系方式</h2>
            <div className="space-y-4">
              {settings?.contact_qq && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--muted-foreground)]">QQ</span>
                  <span>{settings.contact_qq}</span>
                </div>
              )}
              {settings?.contact_wechat && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--muted-foreground)]">微信</span>
                  <span>{settings.contact_wechat}</span>
                </div>
              )}
              {settings?.contact_email && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--muted-foreground)]">邮箱</span>
                  <a href={`mailto:${settings.contact_email}`} className="text-[var(--primary)] hover:underline">{settings.contact_email}</a>
                </div>
              )}
              {settings?.contact_telegram && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--muted-foreground)]">Telegram</span>
                  <span>{settings.contact_telegram}</span>
                </div>
              )}
              {settings?.contact_github && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--muted-foreground)]">GitHub</span>
                  <a href={`https://github.com/${settings.contact_github}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">{settings.contact_github}</a>
                </div>
              )}
              {!settings?.contact_qq && !settings?.contact_wechat && !settings?.contact_email && !settings?.contact_telegram && !settings?.contact_github && (
                <p className="text-[var(--muted-foreground)] text-sm">暂未设置联系方式</p>
              )}
            </div>
          </div>

          {/* 关于本站 */}
          <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)]">
            <h2 className="text-lg font-semibold mb-4">关于本站</h2>
            {settings?.about_text ? (
              <p className="text-[var(--muted-foreground)] leading-relaxed whitespace-pre-wrap">{settings.about_text}</p>
            ) : (
              <p className="text-[var(--muted-foreground)] text-sm">暂未设置站点介绍</p>
            )}
          </div>

          {/* 微信二维码 */}
          {settings?.wechat_qr_code && (
            <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)] md:col-span-2">
              <h2 className="text-lg font-semibold mb-4">微信二维码</h2>
              <img src={settings.wechat_qr_code} alt="微信二维码" className="w-48 h-48 object-contain rounded-lg" />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
