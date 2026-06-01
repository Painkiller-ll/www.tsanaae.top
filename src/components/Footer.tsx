'use client';

import { useState, useEffect } from 'react';

interface SiteFooterSettings {
  site_name: string;
}

export default function Footer() {
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

  return (
    <footer className="border-t border-border bg-background mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Powered by {siteName}
          </p>
        </div>
      </div>
    </footer>
  );
}
