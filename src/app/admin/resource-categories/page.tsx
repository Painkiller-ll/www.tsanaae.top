'use client';

import { useState, useEffect } from 'react';
import { RESOURCE_TYPES, type ResourceType } from '@/lib/types';

interface Category {
  id: number;
  name: string;
  slug: string;
  resource_type: string;
  parent_id: number | null;
  icon: string;
  sort_order: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', resource_type: 'game', parent_id: '', icon: '', sort_order: 0 });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resource-categories');
      const data = await res.json();
      setCategories(data.data || data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) return alert('请填写名称和标识');
    try {
      const res = await fetch('/api/admin/resource-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          parent_id: form.parent_id ? parseInt(form.parent_id) : null,
        }),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm({ name: '', slug: '', resource_type: 'game', parent_id: '', icon: '', sort_order: 0 });
        loadCategories();
      } else {
        const err = await res.json();
        alert(err.error || '创建失败');
      }
    } catch { alert('创建失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此分类？')) return;
    try {
      const res = await fetch(`/api/admin/resource-categories/${id}`, { method: 'DELETE' });
      if (res.ok) loadCategories();
      else alert('删除失败');
    } catch {}
  };

  const filtered = typeFilter === 'all' ? categories : categories.filter(c => c.resource_type === typeFilter);
  const parentCategories = categories.filter(c => !c.parent_id);
  const filteredParents = typeFilter === 'all' ? parentCategories : parentCategories.filter(c => c.resource_type === typeFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">分类管理</h1>
        <button onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90">
          + 新增分类
        </button>
      </div>

      {/* 类型筛选 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground border border-border'}`}>
          全部
        </button>
        {(Object.entries(RESOURCE_TYPES) as [ResourceType, typeof RESOURCE_TYPES[ResourceType]][]).map(([key, config]) => (
          <button key={key} onClick={() => setTypeFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === key ? 'text-white' : 'bg-white/5 text-muted-foreground border border-border'}`}
            style={typeFilter === key ? { backgroundColor: config.color } : {}}>
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      {/* 新增表单 */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-5 rounded-xl border border-border bg-card mb-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">新增分类</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">分类名称 *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" placeholder="如：单机游戏" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">标识(slug) *</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" placeholder="如：pc-game" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">所属类型 *</label>
              <select value={form.resource_type} onChange={e => setForm(f => ({ ...f, resource_type: e.target.value, parent_id: '' }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm">
                {(Object.entries(RESOURCE_TYPES) as [ResourceType, typeof RESOURCE_TYPES[ResourceType]][]).map(([key, config]) => (
                  <option key={key} value={key}>{config.icon} {config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">父分类(留空=顶级)</label>
              <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm">
                <option value="">无（顶级分类）</option>
                {categories.filter(c => c.resource_type === form.resource_type && !c.parent_id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">图标(emoji)</label>
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" placeholder="🎮" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">排序</label>
              <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90">创建</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-border text-muted-foreground text-sm">取消</button>
          </div>
        </form>
      )}

      {/* 分类列表 */}
      {loading ? <div className="text-center py-8 text-muted-foreground">加载中...</div> : (
        <div className="space-y-3">
          {filteredParents.map(parent => {
            const children = filtered.filter(c => c.parent_id === parent.id);
            const typeConfig = RESOURCE_TYPES[parent.resource_type as ResourceType];
            return (
              <div key={parent.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{parent.icon}</span>
                    <span className="font-medium text-foreground">{parent.name}</span>
                    <span className="text-xs text-muted-foreground">/{parent.slug}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: (typeConfig?.color || '#888') + '20', color: typeConfig?.color || '#888' }}>
                      {typeConfig?.label}
                    </span>
                  </div>
                  <button onClick={() => handleDelete(parent.id)} className="text-xs text-red-400 hover:underline">删除</button>
                </div>
                {children.length > 0 && (
                  <div className="border-t border-border">
                    {children.map(child => (
                      <div key={child.id} className="flex items-center justify-between px-4 py-2 pl-10 border-b border-border last:border-0 hover:bg-white/[0.02]">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{child.icon}</span>
                          <span className="text-sm text-foreground">{child.name}</span>
                          <span className="text-xs text-muted-foreground">/{child.slug}</span>
                        </div>
                        <button onClick={() => handleDelete(child.id)} className="text-xs text-red-400 hover:underline">删除</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
