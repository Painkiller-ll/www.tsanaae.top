'use client';

import { useEffect, useState } from 'react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  created_at: string;
}

const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
  info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: 'ℹ️' },
  warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '⚠️' },
  success: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '✅' },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🚨' },
};

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(data => {
        if (data.announcements && data.announcements.length > 0) {
          setAnnouncements(data.announcements);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-rotate announcements
  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (announcements.length === 0 || dismissed) return null;

  const current = announcements[currentIndex];
  const style = typeStyles[current.type] || typeStyles.info;
  const isExpanded = expandedId === current.id;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
      <div
        className={`rounded-xl border ${style.border} ${style.bg} px-4 py-3 transition-all cursor-pointer`}
        onClick={() => setExpandedId(isExpanded ? null : current.id)}
      >
        <div className="flex items-center gap-3">
          <span className="text-base shrink-0">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{current.title}</span>
              {announcements.length > 1 && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {currentIndex + 1}/{announcements.length}
                </span>
              )}
            </div>
            <p className={`text-xs text-muted-foreground mt-0.5 ${isExpanded ? '' : 'line-clamp-1'}`}>
              {current.content}
            </p>
            {isExpanded && current.content.length > 50 && (
              <div className="mt-2 pt-2 border-t border-border">
                <p className="text-xs text-foreground/80 whitespace-pre-wrap leading-relaxed">{current.content}</p>
              </div>
            )}
          </div>
          {announcements.length > 1 && (
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setCurrentIndex(prev => prev === 0 ? announcements.length - 1 : prev - 1)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                onClick={() => setCurrentIndex(prev => (prev + 1) % announcements.length)}
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); setDismissed(true); }}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
