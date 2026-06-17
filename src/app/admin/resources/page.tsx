'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  study: '学习资料', movie: '影视剧', music: '音乐',
  game: '游戏', novel: '小说', software: '实用软件',
};

const TYPE_COLORS: Record<string, string> = {
  study: 'bg-blue-100 text-blue-700', movie: 'bg-red-100 text-red-700', music: 'bg-pink-100 text-pink-700',
  game: 'bg-violet-100 text-violet-700', novel: 'bg-green-100 text-green-700', software: 'bg-orange-100 text-orange-700',
};

export default function AdminResources() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const pageSize = 20;

  const fetchResources = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (typeFilter) params.set('resource_type', typeFilter);
    if (search) params.set('search', search);

    const token = document.cookie.split('admin_token=')[1]?.split(';')[0];
    const res = await fetch(`/api/admin/resources?${params}`, { headers: { authorization: `Bearer ${token}` } });
    const data = await res.json();
    setResources(data.resources || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, typeFilter, search]);

  useEffect(() => { fetchResources(); }, [fetchResources]);

  const totalPages = Math.ceil(total / pageSize);

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === resources.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(resources.map(r => r.id)));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此资源？')) return;
    const token = document.cookie.split('admin_token=')[1]?.split(';')[0];
    await fetch(`/api/admin/resources/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } });
    fetchResources();
  };

  const handleBatchDelete = async () => {
    if (!confirm(`确定删除选中的 ${selected.size} 个资源？`)) return;
    const token = document.cookie.split('admin_token=')[1]?.split(';')[0];
    await Promise.all([...selected].map(id =>
      fetch(`/api/admin/resources/${id}`, { method: 'DELETE', headers: { authorization: `Bearer ${token}` } })
    ));
    setSelected(new Set());
    fetchResources();
  };

  const handleToggle = async (id: number, field: string, value: boolean) => {
    const token = document.cookie.split('admin_token=')[1]?.split(';')[0];
    await fetch(`/api/admin/resources/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ [field]: value }),
    });
    fetchResources();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">资源管理</h1>
        <Link href="/admin/resources/new" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">
          + 新增资源
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          <option value="">全部类型</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            placeholder="搜索资源标题..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (setPage(1), fetchResources())}
            className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm pr-8"
          />
          <button onClick={() => { setPage(1); fetchResources(); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">🔍</button>
        </div>
        {selected.size > 0 && (
          <button onClick={handleBatchDelete} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">
            删除选中 ({selected.size})
          </button>
        )}
        <span className="text-sm text-gray-400 ml-auto">共 {total} 条</span>
      </div>

      {/* 资源列表 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-gray-400">加载中...</div>
        ) : resources.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            暂无资源，<Link href="/admin/resources/new" className="text-violet-600 hover:underline">去添加</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.size === resources.length} onChange={toggleAll} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">标题</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">类型</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">评分</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">浏览</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">状态</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">精选</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {resources.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.cover_url && <img src={r.cover_url} alt="" className="w-8 h-8 rounded object-cover" />}
                      <Link href={`/admin/resources/${r.id}/edit`} className="text-gray-800 hover:text-violet-600 font-medium line-clamp-1">
                        {r.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[r.resource_type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[r.resource_type] || r.resource_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.avg_rating ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{r.view_count ?? 0}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(r.id, 'is_published', !r.is_published)}
                      className={`text-xs px-2 py-0.5 rounded-full ${r.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                    >
                      {r.is_published ? '已发布' : '草稿'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(r.id, 'is_featured', !r.is_featured)}
                      className={`text-xs ${r.is_featured ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      {r.is_featured ? '★' : '☆'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/admin/resources/${r.id}/edit`} className="text-violet-600 hover:text-violet-800">编辑</Link>
                      <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(1)} disabled={page === 1} className="px-3 py-1 rounded border text-sm disabled:opacity-30">首页</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border text-sm disabled:opacity-30">上一页</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border text-sm disabled:opacity-30">下一页</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 rounded border text-sm disabled:opacity-30">末页</button>
        </div>
      )}
    </div>
  );
}
