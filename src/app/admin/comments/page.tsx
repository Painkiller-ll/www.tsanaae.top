'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminFetch, safeJson } from '@/lib/admin-fetch';

interface Comment {
  id: number;
  article_id: number;
  article_title: string;
  content: string;
  author_name: string;
  status: string;
  created_at: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    loadComments();
  }, [filter]);

  const loadComments = async () => {
    try {
      const url = filter === 'all' ? '/api/admin/article-comments' : `/api/admin/article-comments?status=${filter}`;
      const data: any = await adminFetch(url).then(safeJson);
      setComments(data?.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await adminFetch(`/api/admin/article-comments`, {
        method: 'PUT',
        body: { id, status },
      });
      const data: any = await safeJson(res);
      if (res.ok) {
        alert(`已${status === 'approved' ? '通过' : '拒绝'}`);
        loadComments();
      } else {
        alert(data?.error || '操作失败');
      }
    } catch {
      alert('操作失败');
    }
  };

  const deleteComment = async (id: number) => {
    if (!confirm('确定删除此评论？')) return;
    try {
      const res = await adminFetch(`/api/admin/article-comments?id=${id}`, { method: 'DELETE' });
      if (res.ok) loadComments();
      else alert('删除失败');
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
        <h1 className="text-xl font-bold text-white">评论审核</h1>
        <Link href="/admin" className="text-gray-400 hover:text-white text-sm">← 返回</Link>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: 'pending', label: '待审核' },
          { key: 'all', label: '全部' },
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
      ) : comments.length === 0 ? (
        <p className="text-gray-500 text-center py-10">暂无评论</p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => (
            <div key={comment.id} className="rounded-xl border border-white/8 p-4" style={{ backgroundColor: '#1a1a24' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {statusLabel(comment.status)}
                    <span className="text-xs text-gray-500">评论于: {comment.article_title}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{comment.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{comment.author_name}</span>
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {comment.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(comment.id, 'approved')} className="px-3 py-1 rounded bg-green-600 text-white text-xs hover:bg-green-700">通过</button>
                      <button onClick={() => updateStatus(comment.id, 'rejected')} className="px-3 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700">拒绝</button>
                    </>
                  )}
                  {comment.status === 'approved' && (
                    <button onClick={() => updateStatus(comment.id, 'rejected')} className="px-3 py-1 rounded bg-red-600/20 text-red-400 text-xs hover:bg-red-600/30">撤回</button>
                  )}
                  {comment.status === 'rejected' && (
                    <button onClick={() => updateStatus(comment.id, 'approved')} className="px-3 py-1 rounded bg-green-600/20 text-green-400 text-xs hover:bg-green-600/30">恢复</button>
                  )}
                  <button onClick={() => deleteComment(comment.id)} className="px-3 py-1 rounded bg-white/5 text-gray-400 text-xs hover:bg-red-600/20 hover:text-red-400">删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
