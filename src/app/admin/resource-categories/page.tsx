'use client';

import { useState, useEffect } from 'react';

const TYPE_LABELS: Record<string, string> = {
  study: '学习资料', movie: '影视剧', music: '音乐',
  game: '游戏', novel: '小说', software: '实用软件',
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

  useEffect(() => { loadCategories(); }, [filterType]);

  const getToken = () => document.cookie.split('admin_token=')[1]?.split(';')[0];

  const loadCategories = async () => {
    const params = filterType ? `?resource_type=${filterType}` : '';
    const res = await fetch(`/api/resource-categories${params}`);
    const data = await res.json();
    setCategories(data.categories || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!form.name.trim() || !form.slug.trim()) return alert('名称和Slug必填');

    if (editing) {
      await fetch(`/api/admin/resource-categories/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          resource_type: form.resource_type,
          parent_id: form.parent_id ? parseInt(form.parent_id) : null,
          icon: form.icon,
          sort_order: form.sort_order,
        }),
      });
    } else {
      await fetch('/api/admin/resource-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          resource_type: form.resource_type,
          parent_id: form.parent_id ? parseInt(form.parent_id) : null,
          icon: form.icon,
          sort_order: form.sort_order,
        }),
      });
    }

    setShowForm(false);
    setEditing(null);
    setForm({ name: '', slug: '', resource_type: 'game', parent_id: '', icon: '', sort_order: 0 });
    loadCategories();
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
    const token = getToken();
    await fetch(`/api/admin/resource-categories/${cat.id}`, {
      method: 'DELETE',
      });
    loadCategories();
  };

  const topLevel = categories.filter(c => c.parent_id === null);
  const getChildren = (parentId: number) => categories.filter(c => c.parent_id === parentId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', slug: '', resource_type: filterType || 'game', parent_id: '', icon: '', sort_order: 0 }); }} className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">
          + 新增分类
        </button>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-violet-500 outline-none" />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="px-5 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">{editing ? '保存修改' : '创建'}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm">取消</button>
            </div>
          </form>
        </div>
      )}

      {/* 分类列表 */}
      <div className="space-y-3">
        {topLevel.map(parent => (
          <div key={parent.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">{parent.icon || '📁'}</span>
                <span className="font-semibold text-gray-900">{parent.name}</span>
                <span className="text-xs text-gray-400">/{parent.slug}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{TYPE_LABELS[parent.resource_type] || parent.resource_type}</span>
                <span className="text-xs text-gray-400">排序: {parent.sort_order}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(parent)} className="text-sm text-violet-600 hover:text-violet-800">编辑</button>
                <button onClick={() => handleDelete(parent)} className="text-sm text-red-500 hover:text-red-700">删除</button>
              </div>
            </div>
            {getChildren(parent.id).length > 0 && (
              <div className="divide-y divide-gray-100">
                {getChildren(parent.id).map(child => (
                  <div key={child.id} className="flex items-center justify-between px-5 py-2.5 pl-12">
                    <div className="flex items-center gap-3">
                      <span>{child.icon || '📄'}</span>
                      <span className="text-gray-800">{child.name}</span>
                      <span className="text-xs text-gray-400">/{child.slug}</span>
                      <span className="text-xs text-gray-400">排序: {child.sort_order}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(child)} className="text-sm text-violet-600 hover:text-violet-800">编辑</button>
                      <button onClick={() => handleDelete(child)} className="text-sm text-red-500 hover:text-red-700">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无分类，点击上方按钮新增</div>
      )}
    </div>
  );
}
