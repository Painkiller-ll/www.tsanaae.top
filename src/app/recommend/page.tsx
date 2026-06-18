'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PromoSettings {
  promo_title: string;
  promo_description: string;
  promo_qr_code_url: string;
  promo_mini_program_name: string;
  promo_tags: string[];
  promo_icon_url: string;
}

const DEFAULT_SETTINGS: PromoSettings = {
  promo_title: '推荐小程序',
  promo_description: '扫码体验精选小程序，支持站长持续更新优质资源',
  promo_qr_code_url: '',
  promo_mini_program_name: '',
  promo_tags: ['免费资源', '收益支持'],
  promo_icon_url: '',
};

export default function RecommendPage() {
  const [settings, setSettings] = useState<PromoSettings | null>(null);

  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(d => {
        setSettings({
          promo_title: d.promo_title || '推荐小程序',
          promo_description: d.promo_description || '扫码体验精选小程序，支持站长持续更新优质资源',
          promo_qr_code_url: d.promo_qr_code_url || '',
          promo_mini_program_name: d.promo_mini_program_name || '',
          promo_tags: d.promo_tags ? (typeof d.promo_tags === 'string' ? d.promo_tags.split(',').filter(Boolean) : d.promo_tags) : ['免费资源', '收益支持'],
          promo_icon_url: d.promo_icon_url || '',
        });
      })
      .catch(() => {
        setSettings(DEFAULT_SETTINGS);
      });
  }, []);

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f0f13' }}>
        <div className="text-zinc-500 text-sm">加载中...</div>
      </div>
    );
  }

  const tagColors: Record<string, { bg: string; border: string; text: string }> = {
    '免费资源': { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-300' },
    '收益支持': { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300' },
    '限时优惠': { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-300' },
    '精选推荐': { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-300' },
    '新用户福利': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300' },
  };

  const defaultTagStyle = { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-300' };

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-16 sm:py-24">
        {/* 返回首页 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#71717a] hover:text-white transition-colors mb-8"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>

        {/* 主内容卡片 */}
        <div className="bg-[#1a1a24] border border-white/[0.08] rounded-2xl overflow-hidden">
          {/* 顶部渐变条 */}
          <div className="h-1 bg-gradient-to-r from-purple-500 via-amber-400 to-purple-500" />

          <div className="p-8 sm:p-10 flex flex-col items-center text-center">
            {/* 图标 */}
            {settings.promo_icon_url ? (
              <img src={settings.promo_icon_url} alt={settings.promo_title} className="w-16 h-16 rounded-2xl mb-5 shadow-lg shadow-purple-500/30 object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/30">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01M7 17h.01M12 17h.01" />
                </svg>
              </div>
            )}

            {/* 标题 */}
            <h1 className="text-2xl font-bold text-white mb-2">
              {settings.promo_title}
            </h1>

            {settings.promo_mini_program_name && (
              <p className="text-sm text-purple-400 mb-2">{settings.promo_mini_program_name}</p>
            )}

            {/* 描述 */}
            <p className="text-sm text-[#71717a] mb-8 max-w-sm">
              {settings.promo_description}
            </p>

            {/* 小程序码 */}
            <div className="bg-white rounded-xl p-3 mb-4 shadow-xl">
              {settings.promo_qr_code_url ? (
                <img
                  src={settings.promo_qr_code_url}
                  alt="小程序码"
                  className="w-44 h-44 object-contain"
                />
              ) : (
                <div className="w-44 h-44 flex flex-col items-center justify-center text-gray-400">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M7 7h.01M12 7h.01M17 7h.01M7 12h.01M12 12h.01M17 12h.01M7 17h.01M12 17h.01" />
                  </svg>
                  <span className="text-xs mt-2">小程序码</span>
                  <span className="text-[10px]">请在后台设置</span>
                </div>
              )}
            </div>

            {/* 扫码提示 */}
            <p className="text-xs text-[#71717a] mb-2">打开微信 → 扫一扫</p>
            <p className="text-[10px] text-[#71717a]/60">长按识别亦可跳转</p>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mt-6 justify-center">
              {settings.promo_tags.map((tag, i) => {
                const style = tagColors[tag] || defaultTagStyle;
                return (
                  <span
                    key={i}
                    className={`px-3 py-1 rounded-full text-xs ${style.bg} border ${style.border} ${style.text}`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#71717a]">
            每次使用推荐小程序，都是对站长持续更新的最大支持
          </p>
        </div>
      </div>
    </div>
  );
}
