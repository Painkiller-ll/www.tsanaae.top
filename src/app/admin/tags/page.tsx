'use client';

import { useEffect, useState } from 'react';

interface Tag {
  id: string;
  name: string;
  created_at: string;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tagName, setTagName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchNames, setBatchNames] = useState('');

  const loadTags = async () => {
    try {
      const res = await fetch('/api/admin/tags');
      const data = await res.json();
      setTags(data.tags || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (batchMode) {
        const names = batchNames
          .split(/[,，\n]/)
          .map((n) => n.trim())
          .filter(Boolean);

        for (const name of names) {
          await fetch('/api/admin/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          });
        }
      } else {
        const res = await fetch('/api/admin/tags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tagName }),
        });

        if (!res.ok) {
          const data = await res.json();
          alert(data.error || '添加失败');
          return;
        }
      }

      setTagName('');
      setBatchNames('');
      setShowForm(false);
      loadTags();
    } catch {
      alert('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定删除标签「${name}」吗？`)) return;
    try {
      await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
      setTags(tags.filter((t) => t.id !== id));
    } catch {
      alert('删除失败');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">标签管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showForm ? '取消' : '+ 添加标签'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 mb-6 space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-lg font-semibold text-foreground">添加标签</h2>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={batchMode}
                onChange={(e) => setBatchMode(e.target.checked)}
                className="rounded border-border"
              />
              批量模式
            </label>
          </div>

          {batchMode ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">标签名称（逗号或换行分隔）</label>
              <textarea
                value={batchNames}
                onChange={(e) => setBatchNames(e.target.value)}
                rows={3}
                placeholder="动作, 冒险, RPG&#10;射击, 策略"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">标签名称 *</label>
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? '添加中...' : '添加'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-muted-foreground">加载中...</div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">共 {tags.length} 个标签</div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <span>{tag.name}</span>
                <button
                  onClick={() => handleDelete(tag.id, tag.name)}
                  className="hidden group-hover:inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors"
                  title="删除标签"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
