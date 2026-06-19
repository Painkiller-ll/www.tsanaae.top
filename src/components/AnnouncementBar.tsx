'use client';

import { useState, useEffect } from 'react';

interface BannerItem {
  text: string;
  link?: string;
  highlight?: boolean;
}

interface BannerData {
  enabled: boolean;
  title: string;
  subtitle: string;
  link_url: string;
  link_text: string;
  bg_color: string;
  items: BannerItem[];
}

export default function AnnouncementBar() {
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentItem, setCurrentItem] = useState(0);

  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(d => {
        setBanner({
          enabled: d.banner_enabled !== false,
          title: d.banner_title || '',
          subtitle: d.banner_subtitle || '',
          link_url: d.banner_link_url || '',
          link_text: d.banner_link_text || '',
          bg_color: d.banner_bg_color || '',
          items: Array.isArray(d.banner_items) ? d.banner_items : [],
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-rotate banner items
  useEffect(() => {
    if (!banner?.items?.length || banner.items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentItem(prev => (prev + 1) % banner.items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banner?.items?.length]);

  if (loading || !banner || !banner.enabled) return null;

  const hasItems = banner.items.length > 0;
  const activeItem = hasItems ? banner.items[currentItem % banner.items.length] : null;

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{
        background: banner.bg_color || 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(168,85,247,0.1))',
      }}
    >
      <div className="px-5 py-4">
        {/* Title row */}
        {banner.title && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base font-bold text-white">{banner.title}</span>
            {banner.link_url && banner.link_text && (
              <a
                href={banner.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-xs px-3 py-1 rounded-full bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 transition-colors"
              >
                {banner.link_text} →
              </a>
            )}
          </div>
        )}

        {/* Subtitle */}
        {banner.subtitle && (
          <p className="text-sm text-zinc-400 mb-2">{banner.subtitle}</p>
        )}

        {/* Banner items - scrolling/rotating text */}
        {hasItems && (
          <div className="relative overflow-hidden" style={{ minHeight: '28px' }}>
            {banner.items.map((item, idx) => (
              <div
                key={idx}
                className={`transition-all duration-500 ${
                  idx === currentItem % banner.items.length
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-4 absolute inset-0'
                }`}
              >
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 text-sm hover:underline ${
                      item.highlight
                        ? 'text-yellow-400 font-medium'
                        : 'text-zinc-300'
                    }`}
                  >
                    {item.highlight && <span className="text-yellow-400">★</span>}
                    {item.text}
                    <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 text-sm ${
                    item.highlight ? 'text-yellow-400 font-medium' : 'text-zinc-300'
                  }`}>
                    {item.highlight && <span className="text-yellow-400">★</span>}
                    {item.text}
                  </span>
                )}
              </div>
            ))}
            {/* Dots indicator */}
            {banner.items.length > 1 && (
              <div className="flex gap-1 mt-1.5 justify-center">
                {banner.items.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentItem(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentItem % banner.items.length
                        ? 'bg-purple-400 w-3'
                        : 'bg-zinc-600 hover:bg-zinc-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* If no items but has link */}
        {!hasItems && banner.link_url && banner.link_text && !banner.title && (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 hover:underline"
          >
            {banner.link_text}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
