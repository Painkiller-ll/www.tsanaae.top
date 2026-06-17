'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch, safeJson } from '@/lib/admin-fetch';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: string;
  cost: number;
  image_url: string;
  stock: number;
  is_active: boolean;
  metadata: Record<string, string>;
  created_at: string;
  purchase_count?: number;
}

export default function AdminShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'virtual',
    cost: 100,
    image_url: '',
    stock: -1,
    is_active: true,
    metadata: '{}',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchItems = async () => {
    try {
      const res = await adminFetch('/api/admin/shop');
      if (res.ok) {
        const data = await safeJson<{ items?: ShopItem[] }>(res);
        setItems(data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      let metadataObj = {};
      try { metadataObj = JSON.parse(form.metadata); } catch { /* ignore */ }

      const body = {
        ...form,
        metadata: metadataObj,
      };

      const url = editingItem ? `/api/admin/shop/${editingItem.id}` : '/api/admin/shop';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setMsg({ type: 'success', text: editingItem ? '更新成功' : '创建成功' });
        setShowForm(false);
        setEditingItem(null);
        resetForm();
        fetchItems();
      } else {
        const data = await safeJson<{ error?: string }>(res);
        setMsg({ type: 'error', text: data.error || '操作失败' });
      }
    } catch {
      setMsg({ type: 'error', text: '网络错误' });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该商品？')) return;
    try {
      const res = await adminFetch(`/api/admin/shop/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMsg({ type: 'success', text: '删除成功' });
        fetchItems();
      }
    } catch {
      setMsg({ type: 'error', text: '删除失败' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const handleEdit = (item: ShopItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      type: item.type,
      cost: item.cost,
      image_url: item.image_url || '',
      stock: item.stock,
      is_active: item.is_active,
      metadata: JSON.stringify(item.metadata || {}, null, 2),
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      type: 'virtual',
      cost: 100,
      image_url: '',
      stock: -1,
      is_active: true,
      metadata: '{}',
    });
  };

  const typeLabels: Record<string, string> = {
    virtual: '虚拟物品',
    unlock: '资源解锁',
    avatar_frame: '头像框',
    title: '专属头衔',
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">加载中...</p></div>;

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      <div className="bg-[#1a1a24] border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-[#71717a] hover:text-white">管理后台</Link>
            <span className="text-[#71717a]">/</span>
            <h1 className="text-lg font-bold text-white">商城管理</h1>
          </div>
          <button
            onClick={() => { resetForm(); setEditingItem(null); setShowForm(!showForm); }}
            className="px-4 py-2 bg-[#7c3aed] text-white text-sm rounded-lg hover:bg-[#6d28d9] transition-colors"
          >
            {showForm ? '取消' : '+ 添加商品'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {msg && (
          <div className={`p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {msg.text}
          </div>
        )}

        {showForm && (
          <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">{editingItem ? '编辑商品' : '添加商品'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#e4e4e7] mb-1">商品名称</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：月兽围城解锁码" className="w-full px-3 py-2 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#7c3aed]" />
              </div>
              <div>
                <label className="block text-sm text-[#e4e4e7] mb-1">类型</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#7c3aed]">
                  <option value="virtual">虚拟物品</option>
                  <option value="unlock">资源解锁</option>
                  <option value="avatar_frame">头像框</option>
                  <option value="title">专属头衔</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#e4e4e7] mb-1">价格（积分）</label>
                <input type="number" min="1" value={form.cost} onChange={(e) => setForm({ ...form, cost: parseInt(e.target.value) || 1 })} className="w-full px-3 py-2 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#7c3aed]" />
              </div>
              <div>
                <label className="block text-sm text-[#e4e4e7] mb-1">库存 <span className="text-[#71717a]">(-1=无限)</span></label>
                <input type="number" min="-1" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || -1 })} className="w-full px-3 py-2 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#7c3aed]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-[#e4e4e7] mb-1">描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="商品描述" rows={2} className="w-full px-3 py-2 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#7c3aed]" />
              </div>
              <div>
                <label className="block text-sm text-[#e4e4e7] mb-1">图片URL</label>
                <input type="text" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." className="w-full px-3 py-2 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#7c3aed]" />
              </div>
              <div>
                <label className="block text-sm text-[#e4e4e7] mb-1">元数据 (JSON)</label>
                <textarea value={form.metadata} onChange={(e) => setForm({ ...form, metadata: e.target.value })} placeholder='{"frame_color": "#7c3aed"}' rows={2} className="w-full px-3 py-2 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white text-sm font-mono focus:outline-none focus:border-[#7c3aed]" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                <span className="text-sm text-[#e4e4e7]">上架</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving || !form.name} className="px-4 py-2 bg-[#7c3aed] text-white text-sm rounded-lg hover:bg-[#6d28d9] disabled:opacity-50 transition-colors">
                {saving ? '保存中...' : '保存'}
              </button>
              <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="px-4 py-2 bg-white/[0.05] text-[#71717a] text-sm rounded-lg hover:bg-white/[0.1] transition-colors">
                取消
              </button>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase">商品</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase">类型</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase">价格</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase">库存</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#71717a] uppercase">状态</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#71717a] uppercase">操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-[#7c3aed]/20 flex items-center justify-center text-[#7c3aed] text-xs">
                          {item.type === 'avatar_frame' ? '🖼' : item.type === 'title' ? '🏷' : '🎁'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-white font-medium">{item.name}</p>
                        {item.description && <p className="text-xs text-[#71717a] truncate max-w-48">{item.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#e4e4e7]">{typeLabels[item.type] || item.type}</td>
                  <td className="px-4 py-3 text-sm text-yellow-400 font-medium">{item.cost}</td>
                  <td className="px-4 py-3 text-sm text-[#e4e4e7]">{item.stock === -1 ? '∞' : item.stock}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${item.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {item.is_active ? '上架' : '下架'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(item)} className="text-xs text-[#7c3aed] hover:text-[#a855f7] mr-3">编辑</button>
                    <button onClick={() => handleDelete(item.id)} className="text-xs text-red-400 hover:text-red-300">删除</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-[#71717a]">暂无商品</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
