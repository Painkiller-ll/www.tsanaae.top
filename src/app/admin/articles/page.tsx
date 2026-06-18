'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminFetch, safeJson } from '@/lib/admin-fetch';

interface Article {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_contact: string;
  category: string;
  tags: string[];
  status: string;
  is_featured: boolean;
  view_count: number;
  cover_image: string;
  created_at: string;
  comment_count?: number;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadArticles();
  }, [filter]);

  const loadArticles = async () => {
    try {
      const url = filter === 'all' ? '/api/admin/articles' : `/api/admin/articles?status=${filter}`;
      const data: any = await adminFetch(url).then(safeJson);
      setArticles(data?.articles || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await adminFetch(`/api/admin/articles`, {
        method: 'PUT',
        body: { id, status },
      });
      const data: any = await safeJson(res);
      if (res.ok) {
        alert(`已${status === 'approved' ? '通过' : '拒绝'}`);
        loadArticles();
      } else {
        alert(data?.error || '操作失败');
      }
    } catch (err) {
      alert('操作失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const toggleFeatured = async (id: number, featured: boolean) => {
    try {
      const res = await adminFetch(`/api/admin/articles`, {
        method: 'PUT',
        body: { id, is_featured: !featured },
      });
      const data: any = await safeJson(res);
      if (res.ok) {
        loadArticles();
      } else {
        alert(data?.error || '操作失败');
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const deleteArticle = async (id: number) => {
    if (!confirm('确定删除此文章？')) return;
    try {
      const res = await adminFetch(`/api/admin/articles?id=${id}`, { method: 'DELETE' });
      const data: any = await safeJson(res);
      if (res.ok) {
        loadArticles();
      } else {
        alert(data?.error || '删除失败');
      }
    } catch {
      alert('删除失败');
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">待审核</span>;
      case 'approved': return <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">已通过</span>;
      case 'rejected': return <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">已拒绝</span>;
      default: return status;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">文章管理</h1>
        <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← 返回</Link>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待审核' },
          { key: 'approved', label: '已通过' },
          { key: 'rejected', label: '已拒绝' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              filter === f.key
                ? 'bg-purple-600 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : articles.length === 0 ? (
        <p className="text-gray-500 text-center py-10">暂无文章</p>
      ) : (
        <div className="space-y-3">
          {articles.map(article => (
            <div key={article.id} className="rounded-xl border border-white/8 p-4" style={{ backgroundColor: '#1a1a24' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {statusLabel(article.status)}
                    {article.is_featured && (
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">精选</span>
                    )}
                    {article.category && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">{article.category}</span>
                    )}
                  </div>
                  <h3 className="text-white font-medium truncate">{article.title}</h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{article.content.substring(0, 120)}...</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>作者: {article.author_name}</span>
                    {article.author_contact && <span>联系方式: {article.author_contact}</span>}
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                    <span>{article.view_count} 次浏览</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {article.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(article.id, 'approved')}
                        className="px-3 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => updateStatus(article.id, 'rejected')}
                        className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700"
                      >
                        拒绝
                      </button>
                    </>
                  )}
                  {article.status === 'approved' && (
                    <button
                      onClick={() => updateStatus(article.id, 'rejected')}
                      className="px-3 py-1 rounded bg-red-600/20 text-red-400 text-xs hover:bg-red-600/30"
                    >
                      撤回
                    </button>
                  )}
                  {article.status === 'rejected' && (
                    <button
                      onClick={() => updateStatus(article.id, 'approved')}
                      className="px-3 py-1 rounded bg-green-600/20 text-green-400 text-xs hover:bg-green-600/30"
                    >
                      恢复
                    </button>
                  )}
                  <button
                    onClick={() => toggleFeatured(article.id, article.is_featured)}
                    className={`px-3 py-1 rounded text-xs ${
                      article.is_featured
                        ? 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {article.is_featured ? '取消精选' : '设为精选'}
                  </button>
                  <button
                    onClick={() => deleteArticle(article.id)}
                    className="px-3 py-1 rounded bg-white/5 text-gray-400 text-xs hover:bg-red-600/20 hover:text-red-400"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
