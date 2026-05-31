'use client';

import { useState, useEffect } from 'react';

interface WishlistItem {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  vote_count: number;
  status: string;
  created_at: string;
}

const statusOptions = [
  { value: 'pending', label: '待处理', color: 'text-yellow-400 bg-yellow-400/10' },
  { value: 'approved', label: '已采纳', color: 'text-green-400 bg-green-400/10' },
  { value: 'completed', label: '已完成', color: 'text-blue-400 bg-blue-400/10' },
  { value: 'rejected', label: '已拒绝', color: 'text-red-400 bg-red-400/10' },
];

export default function AdminWishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    try {
      const res = await fetch('/api/wishlist?limit=100&status=all');
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

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/wishlist/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchItems();
      }
    } catch {
      // 静默
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('确定删除此心愿？')) return;
    try {
      const res = await fetch(`/api/admin/wishlist/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchItems();
      }
    } catch {
      // 静默
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">心愿单管理</h1>

      {loading ? (
        <div className="text-center py-8 text-zinc-500">加载中...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-zinc-500">暂无心愿</div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const status = statusOptions.find(s => s.value === item.status) || statusOptions[0];
            return (
              <div key={item.id} className="bg-[#1a1a24] rounded-xl p-5 border border-white/5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-200">{item.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-purple-400">{item.vote_count} 票</span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-1">{new Date(item.created_at).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <select
                      value={item.status}
                      onChange={e => updateStatus(item.id, e.target.value)}
                      className="bg-[#0f0f13] border border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-purple-500"
                    >
                      {statusOptions.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
