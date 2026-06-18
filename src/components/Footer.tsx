'use client';

import { useState, useEffect } from 'react';

interface SiteSettings {
  site_name: string;
  footer_text: string;
  contact_qq: string;
  contact_wechat: string;
  contact_email: string;
  contact_telegram: string;
  contact_github: string;
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
  const hasContact = settings?.contact_qq || settings?.contact_email || settings?.contact_telegram || settings?.contact_github;

  return (
    <footer className="border-t border-border bg-background mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* 联系方式 */}
        {hasContact && (
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4 text-xs text-muted-foreground">
            {settings?.contact_qq && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                QQ: {settings.contact_qq}
              </span>
            )}
            {settings?.contact_email && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                {settings.contact_email}
              </span>
            )}
            {settings?.contact_telegram && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                {settings.contact_telegram}
              </span>
            )}
            {settings?.contact_github && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                {settings.contact_github}
              </span>
            )}
          </div>
        )}
        {/* 版权信息 */}
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
