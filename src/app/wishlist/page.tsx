'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  vote_count: number;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  has_voted?: boolean;
  created_at: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'text-yellow-400 bg-yellow-400/10' },
  approved: { label: '已采纳', color: 'text-green-400 bg-green-400/10' },
  completed: { label: '已完成', color: 'text-blue-400 bg-blue-400/10' },
  rejected: { label: '已拒绝', color: 'text-red-400 bg-red-400/10' },
};

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setItems(data.wishlist || []);
      }
    } catch {
      // 静默
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });
      if (res.ok) {
        setNewTitle('');
        setNewDesc('');
        setShowForm(false);
        fetchWishlist();
      } else {
        const data = await res.json();
        alert(data.error || '提交失败');
      }
    } catch {
      alert('提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(item: WishlistItem) {
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', wishlist_id: item.id }),
      });
      if (res.ok) {
        fetchWishlist();
      }
    } catch {
      // 静默
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题区 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">游戏心愿单</h1>
            <p className="text-zinc-500 text-sm mt-1">想玩什么游戏？说出来让大家一起投票</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {showForm ? '取消' : '提心愿'}
          </button>
        </div>

        {/* 提交表单 */}
        {showForm && (
          <div className="bg-[#1a1a24] rounded-xl p-6 mb-6 border border-white/5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">提交游戏心愿</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="游戏名称"
                className="w-full px-4 py-2.5 bg-[#0f0f13] border border-white/10 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="描述一下为什么想要这个游戏（选填）"
                rows={3}
                className="w-full px-4 py-2.5 bg-[#0f0f13] border border-white/10 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !newTitle.trim()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {submitting ? '提交中...' : '提交 (+5积分)'}
              </button>
            </div>
          </div>
        )}

        {/* 心愿列表 */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎮</div>
            <p className="text-zinc-500">还没有人心愿，来做第一个吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const status = statusMap[item.status] || statusMap.pending;
              return (
                <div
                  key={item.id}
                  className="bg-[#1a1a24] rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleVote(item)}
                      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        item.has_voted
                          ? 'bg-purple-600/20 text-purple-400'
                          : 'bg-white/5 text-zinc-500 hover:text-purple-400 hover:bg-purple-600/10'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-bold">{item.vote_count}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-zinc-200 truncate">{item.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
