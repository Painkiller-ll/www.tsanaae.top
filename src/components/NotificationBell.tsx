'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // 每30秒轮询一次
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/user/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      }
    } catch {
      // 静默失败
    }
  }

  async function markAsRead(id: string) {
    try {
      await fetch('/api/user/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // 静默
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

  function getTypeIcon(type: string) {
    switch (type) {
      case 'comment_reply': return '💬';
      case 'rating': return '⭐';
      case 'invite': return '👥';
      case 'unlock': return '🔓';
      case 'purchase': return '🛒';
      case 'system': return '📢';
      default: return '🔔';
    }
  }

  if (!document.cookie.includes('user_token')) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen && unreadCount > 0) fetchNotifications(); }}
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
      >
        <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-sm font-semibold text-zinc-200">消息通知</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                全部已读
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 text-sm">暂无通知</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.is_read) markAsRead(n.id); }}
                  className={`px-4 py-3 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors ${
                    !n.is_read ? 'bg-purple-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{getTypeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-200 font-medium truncate">{n.title}</span>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                        )}
                      </div>
                      {n.content && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{n.content}</p>
                      )}
                      <span className="text-[10px] text-zinc-600 mt-1 block">{getTimeAgo(n.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            className="block text-center py-2.5 text-xs text-purple-400 hover:text-purple-300 border-t border-white/5 transition-colors"
          >
            查看全部通知
          </Link>
        </div>
      )}
    </div>
  );
}
