'use client';

import { useState, useEffect } from 'react';

interface SiteSettings {
  site_name: string;
  footer_text: string;
}

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(d => { setSettings(d); })
      .catch(() => {});
  }, []);

  const siteName = settings?.site_name || 'Tsanaae';
  const footerText = settings?.footer_text;

  return (
    <footer className="border-t border-border bg-background mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col items-center gap-1">
          {footerText && <p className="text-xs text-muted-foreground">{footerText}</p>}
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
