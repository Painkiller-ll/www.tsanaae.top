'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RESOURCE_TYPES, type ResourceType } from '@/lib/types';

interface Resource {
  id: number;
  title: string;
  resource_type: string;
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  avg_rating: number;
  created_at: string;
  category: { id: number; name: string } | null;
}

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  useEffect(() => {
    loadResources();
  }, [typeFilter, page]);

  const loadResources = () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: pageSize.toString(),
      offset: ((page - 1) * pageSize).toString(),
      sort: 'newest',
    });
    // Use admin-specific query that includes unpublished
    fetch(`/api/admin/resources?${typeFilter !== 'all' ? `type=${typeFilter}` : ''}&page=${page}&pageSize=${pageSize}`)
      .then(r => r.json())
      .then(d => {
        setResources(d.data || []);
        setTotal(d.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此资源？此操作不可撤销。')) return;
    try {
      const res = await fetch(`/api/admin/resources/${id}`, { method: 'DELETE' });
      if (res.ok) loadResources();
      else alert('删除失败');
    } catch { alert('删除失败'); }
  };

  const handleTogglePublish = async (id: number, published: boolean) => {
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !published }),
      });
      if (res.ok) loadResources();
    } catch {}
  };

  const handleToggleFeatured = async (id: number, featured: boolean) => {
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !featured }),
      });
      if (res.ok) loadResources();
    } catch {}
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">资源管理</h1>
        <Link
          href="/admin/resources/new"
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          + 新增资源
        </Link>
      </div>

      {/* 类型筛选 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => { setTypeFilter('all'); setPage(1); }}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground border border-border'}`}
        >
          全部
        </button>
        {(Object.entries(RESOURCE_TYPES) as [ResourceType, typeof RESOURCE_TYPES[ResourceType]][]).map(([key, config]) => (
          <button
            key={key}
            onClick={() => { setTypeFilter(key); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === key ? 'text-white' : 'bg-white/5 text-muted-foreground border border-border'}`}
            style={typeFilter === key ? { backgroundColor: config.color } : {}}
          >
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      {/* 资源列表 */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-card">
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">ID</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">标题</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">类型</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">分类</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">状态</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">精选</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">浏览</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : resources.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">暂无资源</td></tr>
            ) : resources.map(r => {
              const typeConfig = RESOURCE_TYPES[r.resource_type as ResourceType];
              return (
                <tr key={r.id} className="border-b border-border hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-muted-foreground">{r.id}</td>
                  <td className="px-4 py-3 text-foreground font-medium max-w-[200px] truncate">{r.title}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: (typeConfig?.color || '#888') + '20', color: typeConfig?.color || '#888' }}>
                      {typeConfig?.icon} {typeConfig?.label || r.resource_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{r.category?.name || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleTogglePublish(r.id, r.is_published)}
                      className={`px-2 py-0.5 rounded text-xs ${r.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {r.is_published ? '已发布' : '草稿'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleToggleFeatured(r.id, r.is_featured)}
                      className={`text-sm ${r.is_featured ? 'text-yellow-400' : 'text-muted-foreground/30'}`}>
                      ★
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{r.view_count}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/admin/resources/${r.id}/edit`} className="text-xs text-primary hover:underline">编辑</Link>
                      <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:underline">删除</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
            上一页
          </button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-border text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
