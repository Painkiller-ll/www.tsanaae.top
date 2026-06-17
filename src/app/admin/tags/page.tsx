'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminFetch, safeJson } from '@/lib/admin-fetch';

interface Tag {
  id: string;
  name: string;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  const fetchTags = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/tags');
      const data = await safeJson<{ tags?: Tag[] }>(res);
      setTags(data.tags || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newTagName.trim()) return;

    try {
      const res = await adminFetch('/api/admin/tags', {
        method: 'POST',
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      const data = await safeJson<{ error?: string }>(res);
      if (res.ok) {
        setNewTagName('');
        fetchTags();
      } else {
        setError(data.error || '创建失败');
      }
    } catch {
      setError('创建失败');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;

    try {
      const res = await adminFetch(`/api/admin/tags/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (res.ok) {
        setEditingTag(null);
        fetchTags();
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此标签？关联的游戏标签也会被删除')) return;

    try {
      await adminFetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
      fetchTags();
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">标签管理</h1>

      {/* Create form */}
      <form onSubmit={handleCreate} className="mb-6 flex gap-3">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="输入新标签名"
          className="flex-1 rounded-xl border border-border/50 bg-secondary/30 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="rounded-xl px-6 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          添加标签
        </button>
      </form>

      {error && (
        <p className="mb-4 text-sm text-red-400">{error}</p>
      )}

      {/* Tags list */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(tag => (
            <div key={tag.id} className="group relative">
              {editingTag?.id === tag.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="rounded-lg border border-primary/50 bg-secondary/30 px-3 py-1.5 text-sm text-foreground focus:outline-none w-24"
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(tag.id)}
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(tag.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingTag(null)}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-card px-3 py-1.5">
                  <span className="text-sm text-foreground">{tag.name}</span>
                  <button
                    onClick={() => { setEditingTag(tag); setEditName(tag.name); }}
                    className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-primary transition-all ml-1"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-red-400 transition-all"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-muted-foreground text-sm">暂无标签</p>
          )}
        </div>
      )}
    </div>
  );
}
