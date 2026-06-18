'use client';

import { useEffect } from 'react';

export default function SiteSettingsLoader() {
  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(settings => {
        // 应用主题色到 CSS 变量
        if (settings.site_accent_color) {
          document.documentElement.style.setProperty('--accent-color', settings.site_accent_color);
        }
        if (settings.site_bg_color) {
          document.documentElement.style.setProperty('--bg-color', settings.site_bg_color);
        }
        if (settings.site_card_color) {
          document.documentElement.style.setProperty('--card-color', settings.site_card_color);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
