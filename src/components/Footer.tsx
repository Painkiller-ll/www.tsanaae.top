'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FooterProps {
  onOpenQrCode?: () => void;
}

interface SiteFooterSettings {
  site_name: string;
  footer_text: string;
  wechat_qr_code: string;
  footer_links: Array<{ label: string; url: string }>;
}

export default function Footer({ onOpenQrCode }: FooterProps) {
  const [settings, setSettings] = useState<SiteFooterSettings | null>(null);

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.data) setSettings(data.data);
      })
      .catch(() => {});
  }, []);

  const siteName = settings?.site_name || 'Tsanaae Game';
  const footerText = settings?.footer_text || '';
  const wechatQrCode = settings?.wechat_qr_code;
  const footerLinks: Array<{ label: string; url: string }> = settings?.footer_links || [];

  return (
    <footer className="border-t border-[rgba(255,255,255,0.06)] bg-[#0a0a0e] mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 站点信息 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span className="text-lg font-bold gradient-text">{siteName}</span>
            </div>
            <p className="text-sm text-[#71717a] leading-relaxed">
              {footerText || '精选优质游戏资源导航，发现你的下一款游戏'}
            </p>
          </div>

          {/* 快捷链接 */}
          <div>
            <h3 className="text-sm font-semibold text-[#e4e4e7] mb-3">快捷导航</h3>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-[#71717a] hover:text-[#a855f7] transition-colors">首页</Link>
              <Link href="/games/pc" className="text-sm text-[#71717a] hover:text-[#a855f7] transition-colors">电脑游戏</Link>
              <Link href="/games/mobile" className="text-sm text-[#71717a] hover:text-[#a855f7] transition-colors">手机游戏</Link>
              {footerLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-[#71717a] hover:text-[#a855f7] transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* 微信二维码 */}
          <div>
            <h3 className="text-sm font-semibold text-[#e4e4e7] mb-3">联系我们</h3>
            {wechatQrCode ? (
              <div className="flex flex-col items-start gap-2">
                <div
                  className="w-28 h-28 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] cursor-pointer hover:border-[#7c3aed] transition-colors"
                  onClick={onOpenQrCode}
                >
                  <img src={wechatQrCode} alt="微信二维码" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-[#71717a]">扫码添加站长微信</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-[#71717a]">暂未设置微信二维码</p>
                <p className="text-xs text-[#71717a]">管理员可在后台设置</p>
              </div>
            )}
          </div>
        </div>

        {/* 底部版权 */}
        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-[#71717a]">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p className="text-xs text-[#71717a]">
            Powered by Tsanaae Game
          </p>
        </div>
      </div>
    </footer>
  );
}
