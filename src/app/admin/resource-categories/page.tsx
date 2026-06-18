'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch, safeJson } from '@/lib/admin-fetch';

const TYPE_LABELS: Record<string, string> = {
  study: '学习资料', movie: '影视剧', music: '音乐',
  game: '游戏', novel: '小说', software: '实用软件',
};

const TYPE_COLORS: Record<string, string> = {
  study: 'bg-blue-100 text-blue-700',
  movie: 'bg-red-100 text-red-700',
  music: 'bg-pink-100 text-pink-700',
  game: 'bg-violet-100 text-violet-700',
  novel: 'bg-emerald-100 text-emerald-700',
  software: 'bg-amber-100 text-amber-700',
};

interface Category {
  id: number;
  name: string;
  slug: string;
  resource_type: string;
  parent_id: number | null;
  icon: string;
  sort_order: number;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', resource_type: 'game', parent_id: '', icon: '', sort_order: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadCategories = useCallback(async () => {
    const params = filterType ? `?type=${filterType}` : '';
    const res = await fetch(`/api/resource-categories${params}`);
    const data = await safeJson<{ data?: Category[] }>(res);
    setCategories(data.data || []);
  }, [filterType]);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  // 内联修改名称
  const handleNameChange = async (id: number, newName: string) => {
    if (!newName.trim()) return;
    setSavingId(id);
    try {
      const res = await adminFetch(`/api/admin/resource-categories/${id}`, {
        method: 'PATCH',
        body: { name: newName },
      });
      if (!res.ok) {
        const data = await safeJson<{ error?: string }>(res);
        alert(`修改名称失败: ${data.error || '未知错误'}`);
      } else {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
      }
    } catch {
      alert('网络错误');
    } finally {
      setSavingId(null);
    }
  };

  // 内联修改图标
  const handleIconChange = async (id: number, newIcon: string) => {
    setSavingId(id);
    try {
      const res = await adminFetch(`/api/admin/resource-categories/${id}`, {
        method: 'PATCH',
        body: { icon: newIcon },
      });
      if (res.ok) {
        setCategories(prev => prev.map(c => c.id === id ? { ...c, icon: newIcon } : c));
      }
    } catch { /* ignore */ } finally {
      setSavingId(null);
    }
  };

  // 排序：上移/下移
  const handleMove = async (id: number, direction: 'up' | 'down') => {
    const sorted = [...categories].filter(c => c.parent_id === null).sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(c => c.id === id);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;

    const swapWith = direction === 'up' ? sorted[idx - 1] : sorted[idx + 1];
    
    try {
      // 交换 sort_order
      const res1 = await adminFetch(`/api/admin/resource-categories/${id}`, {
        method: 'PATCH',
        body: { sort_order: swapWith.sort_order },
      });
      const res2 = await adminFetch(`/api/admin/resource-categories/${swapWith.id}`, {
        method: 'PATCH',
        body: { sort_order: sorted[idx].sort_order },
      });

      if (res1.ok && res2.ok) {
        setCategories(prev => prev.map(c => {
          if (c.id === id) return { ...c, sort_order: swapWith.sort_order };
          if (c.id === swapWith.id) return { ...c, sort_order: sorted[idx].sort_order };
          return c;
        }));
      } else {
        loadCategories(); // 刷新
      }
    } catch {
      loadCategories();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return alert('名称和Slug必填');
    setSubmitting(true);

    try {
      const body = {
        name: form.name,
        slug: form.slug,
        resource_type: form.resource_type,
        parent_id: form.parent_id ? parseInt(form.parent_id) : null,
        icon: form.icon,
        sort_order: form.sort_order,
      };

      if (editing) {
        const res = await adminFetch(`/api/admin/resource-categories/${editing.id}`, {
          method: 'PATCH',
          body,
        });
        if (!res.ok) {
          const data = await safeJson<{ error?: string }>(res);
          alert(`修改失败: ${data.error || '未知错误'}`);
          setSubmitting(false);
          return;
        }
      } else {
        const res = await adminFetch('/api/admin/resource-categories', {
          method: 'POST',
          body,
        });
        if (!res.ok) {
          const data = await safeJson<{ error?: string }>(res);
          alert(`创建失败: ${data.error || '未知错误'}`);
          setSubmitting(false);
          return;
        }
      }

      setShowForm(false);
      setEditing(null);
      setForm({ name: '', slug: '', resource_type: filterType || 'game', parent_id: '', icon: '', sort_order: 0 });
      loadCategories();
    } catch (err) {
      alert(`操作失败: ${err instanceof Error ? err.message : '网络错误'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      resource_type: cat.resource_type,
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      icon: cat.icon || '',
      sort_order: cat.sort_order || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`确定删除分类「${cat.name}」？其下子分类也会被删除！`)) return;
    try {
      const res = await adminFetch(`/api/admin/resource-categories/${cat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await safeJson<{ error?: string }>(res);
        alert(`删除失败: ${data.error || '未知错误'}`);
        return;
      }
      loadCategories();
    } catch (err) {
      alert(`删除失败: ${err instanceof Error ? err.message : '网络错误'}`);
    }
  };

  const topLevel = categories.filter(c => c.parent_id === null).sort((a, b) => a.sort_order - b.sort_order);
  const getChildren = (parentId: number) => categories.filter(c => c.parent_id === parentId).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', slug: '', resource_type: filterType || 'game', parent_id: '', icon: '', sort_order: 0 }); }} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">
          + 新增分类
        </button>
      </div>

      {/* 提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
        点击分类的<strong>图标</strong>可修改图标，点击<strong>名称</strong>可直接修改名称，使用<strong>↑↓</strong>按钮调整首页显示顺序。
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterType('')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${!filterType ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          全部
        </button>
        {Object.entries(TYPE_LABELS).map(([k, v]) => (
          <button key={k} onClick={() => setFilterType(k)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterType === k ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* 新增/编辑表单 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-base font-semibold text-gray-800 mb-4">{editing ? '编辑分类' : '新增分类'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类名称 *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" placeholder="如: 单机游戏" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none" placeholder="如: pc-game" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">资源类型 *</label>
              <select value={form.resource_type} onChange={e => setForm(f => ({ ...f, resource_type: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">父分类</label>
              <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none">
                <option value="">无（顶级分类）</option>
                {topLevel.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">图标（Emoji）</label>
              <input type="text" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none" placeholder="如: 🎮" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序（数字越小越靠前）</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none" />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" disabled={submitting} className="px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium disabled:opacity-50">{submitting ? '提交中...' : editing ? '保存修改' : '创建'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* 分类列表 - 卡片式展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topLevel.map((parent, idx) => (
          <div key={parent.id} className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md ${savingId === parent.id ? 'opacity-60' : ''}`}>
            {/* 卡片头部：图标 + 名称 + 类型标签 + 排序按钮 */}
            <div className="px-4 py-3 flex items-center gap-3">
              {/* 图标 - 可点击修改 */}
              <button
                onClick={() => {
                  const newIcon = prompt('输入新图标（Emoji）:', parent.icon || '📁');
                  if (newIcon !== null) handleIconChange(parent.id, newIcon);
                }}
                className="text-2xl hover:bg-gray-100 rounded-lg p-1 transition"
                title="点击修改图标"
              >
                {parent.icon || '📁'}
              </button>

              {/* 名称 - 可点击修改 */}
              <button
                onClick={() => {
                  const newName = prompt('输入新名称:', parent.name);
                  if (newName !== null && newName.trim()) handleNameChange(parent.id, newName.trim());
                }}
                className="font-semibold text-gray-900 hover:text-violet-600 transition text-left"
                title="点击修改名称"
              >
                {parent.name}
              </button>

              <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[parent.resource_type] || 'bg-gray-100 text-gray-700'}`}>
                {TYPE_LABELS[parent.resource_type] || parent.resource_type}
              </span>

              {/* 排序按钮 */}
              <div className="ml-auto flex flex-col gap-0.5">
                <button
                  onClick={() => handleMove(parent.id, 'up')}
                  disabled={idx === 0}
                  className="text-xs text-gray-400 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="上移"
                >▲</button>
                <button
                  onClick={() => handleMove(parent.id, 'down')}
                  disabled={idx === topLevel.length - 1}
                  className="text-xs text-gray-400 hover:text-violet-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="下移"
                >▼</button>
              </div>
            </div>

            {/* 子分类 */}
            {getChildren(parent.id).length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2 space-y-1">
                {getChildren(parent.id).map(child => (
                  <div key={child.id} className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{child.icon || '📄'}</span>
                    <span>{child.name}</span>
                    <span className="text-xs text-gray-400">/{child.slug}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 操作栏 */}
            <div className="border-t border-gray-100 px-4 py-2 flex gap-3 text-sm">
              <button onClick={() => startEdit(parent)} className="text-violet-600 hover:text-violet-800">编辑详情</button>
              <button onClick={() => handleDelete(parent)} className="text-red-500 hover:text-red-700">删除</button>
              <span className="ml-auto text-xs text-gray-400">排序: {parent.sort_order}</span>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无分类，点击上方按钮新增</div>
      )}
    </div>
  );
}
