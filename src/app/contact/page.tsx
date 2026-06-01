'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import Link from 'next/link';

interface SiteSettings {
  site_name?: string;
  contact_qq?: string;
  contact_wechat?: string;
  contact_email?: string;
  contact_telegram?: string;
  contact_github?: string;
  about_text?: string;
  wechat_qr_code?: string;
}

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data.settings || {}))
      .catch(() => {});
  }, []);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    }
  };

  const contacts = [
    { key: 'qq', label: 'QQ', value: settings.contact_qq, icon: '💬', color: 'from-blue-500 to-blue-600' },
    { key: 'wechat', label: '微信', value: settings.contact_wechat, icon: '💚', color: 'from-green-500 to-green-600' },
    { key: 'email', label: '邮箱', value: settings.contact_email, icon: '📧', color: 'from-red-500 to-red-600' },
    { key: 'telegram', label: 'Telegram', value: settings.contact_telegram, icon: '✈️', color: 'from-sky-400 to-sky-600' },
    { key: 'github', label: 'GitHub', value: settings.contact_github, icon: '🐙', color: 'from-gray-600 to-gray-800' },
  ].filter(c => c.value);

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <PageHeader title="联系我们" breadcrumbs={[{ label: '首页', href: '/' }]} />

        {/* 关于我们 */}
        {settings.about_text && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">关于 {settings.site_name || 'Tsanaae Game'}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{settings.about_text}</p>
          </div>
        )}

        {/* 联系方式 */}
        {contacts.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">联系方式</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contacts.map(c => (
                <div
                  key={c.key}
                  className="flex items-center gap-4 bg-secondary/30 rounded-lg p-4 border border-border hover:border-purple-500/50 transition-colors"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-xl shrink-0`}>
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground">{c.label}</div>
                    <div className="text-foreground font-medium truncate">{c.value}</div>
                  </div>
                  <button
                    onClick={() => copyText(c.value!, c.label)}
                    className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shrink-0"
                  >
                    {copied === c.label ? '已复制' : '复制'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 微信二维码 */}
        {settings.wechat_qr_code && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">微信二维码</h2>
            <div className="flex justify-center">
              <img
                src={settings.wechat_qr_code}
                alt="微信二维码"
                className="w-48 h-48 rounded-lg object-cover"
              />
            </div>
            <p className="text-center text-muted-foreground text-sm mt-3">扫描二维码添加微信</p>
          </div>
        )}

        {/* 无信息提示 */}
        {contacts.length === 0 && !settings.about_text && !settings.wechat_qr_code && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="text-4xl mb-4">📬</div>
            <h3 className="text-lg font-medium text-foreground mb-2">暂无联系方式</h3>
            <p className="text-muted-foreground">站长尚未设置联系方式，请稍后再来查看</p>
          </div>
        )}
      </div>
    </div>
  );
}
