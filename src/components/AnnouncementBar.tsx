'use client';

import { useState, useEffect } from 'react';

interface Ad {
  id: number;
  title: string;
  content: string;
  link_url: string;
  link_text: string;
  bg_color: string;
  sort_order: number;
}

export default function AnnouncementBar() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ads')
      .then(r => r.json())
      .then(data => {
        const items = Array.isArray(data) ? data : (data.data || []);
        setAds(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || ads.length === 0) return null;

  return (
    <div className="space-y-3">
      {ads.map((ad) => (
        <div
          key={ad.id}
          className="rounded-xl p-4 border border-white/10 transition-all duration-200 hover:border-purple-500/30"
          style={{ backgroundColor: ad.bg_color || '#1a1a2e' }}
        >
          {ad.title && (
            <h3 className="text-sm font-bold text-white mb-1">{ad.title}</h3>
          )}
          {ad.content && (
            <p className="text-xs text-zinc-400 leading-relaxed">{ad.content}</p>
          )}
          {ad.link_url && ad.link_text && (
            <a
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              {ad.link_text} →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
