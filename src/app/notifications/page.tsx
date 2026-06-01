'use client';

import PageHeader from '@/components/PageHeader';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  comment_reply: '💬',
  rating: '⭐',
  invite: '👥',
  unlock: '🔓',
  purchase: '🛒',
  system: '📢',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/user/notifications?limit=50');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // 静默
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    try {
      await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // 静默
    }
  }

  function getTimeAgo(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
    return date.toLocaleDateString('zh-CN');
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <PageHeader title="消息通知" breadcrumbs={[{ label: '首页', href: '/' }, { label: '消息通知' }]} />
            {unreadCount > 0 && (
              <p className="text-zinc-500 text-sm mt-1">{unreadCount} 条未读</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="px-4 py-2 text-sm text-purple-400 hover:text-purple-300 bg-purple-400/10 hover:bg-purple-400/15 rounded-lg transition-colors"
            >
              全部已读
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-zinc-500">加载中...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-zinc-500">暂无通知</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`bg-card rounded-xl p-4 border border-border/50 transition-colors ${
                  !n.is_read ? 'border-l-2 border-l-purple-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{typeIcons[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-200">{n.title}</span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                      )}
                    </div>
                    {n.content && (
                      <p className="text-xs text-zinc-500 mt-1">{n.content}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-zinc-600">{getTimeAgo(n.created_at)}</span>
                      {n.link && (
                        <Link
                          href={n.link}
                          className="text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          查看详情
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
