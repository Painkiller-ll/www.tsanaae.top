'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch, safeJson } from '@/lib/admin-fetch';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const typeOptions = [
  { value: 'info', label: '信息', color: 'bg-blue-500' },
  { value: 'warning', label: '警告', color: 'bg-yellow-500' },
  { value: 'success', label: '成功', color: 'bg-green-500' },
  { value: 'error', label: '紧急', color: 'bg-red-500' },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    is_active: true,
    start_date: '',
    end_date: '',
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await adminFetch('/api/announcements?all=true');
      const data = await safeJson<{ announcements?: Announcement[] }>(res);
      setAnnouncements(data.announcements || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        id: editingId || undefined,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      const res = await adminFetch('/api/announcements', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setForm({ title: '', content: '', type: 'info', is_active: true, start_date: '', end_date: '' });
        fetchAnnouncements();
      } else {
        const data = await safeJson<{ error?: string }>(res);
        alert(`保存失败: ${data.error || '未知错误'}`);
      }
    } catch (err) {
      alert(`保存失败: ${err instanceof Error ? err.message : '网络错误'}`);
    } finally { setSaving(false); }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setForm({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      is_active: announcement.is_active,
      start_date: announcement.start_date ? announcement.start_date.slice(0, 16) : '',
      end_date: announcement.end_date ? announcement.end_date.slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此公告？')) return;
    try {
      await adminFetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      fetchAnnouncements();
    } catch { /* ignore */ }
  };

  const toggleActive = async (announcement: Announcement) => {
    try {
      await adminFetch('/api/announcements', {
        method: 'PUT',
        body: JSON.stringify({ id: announcement.id, is_active: !announcement.is_active }),
      });
      fetchAnnouncements();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">公告管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理网站公告和通知</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setForm({ title: '', content: '', type: 'info', is_active: true, start_date: '', end_date: '' });
          }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showForm ? '取消' : '+ 新建公告'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? '编辑公告' : '新建公告'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">标题</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                placeholder="公告标题"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">内容</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 resize-none"
                rows={3}
                placeholder="公告内容"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">类型</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'info' | 'warning' | 'success' | 'error' })}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                >
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">状态</label>
                <select
                  value={form.is_active ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="true">启用</option>
                  <option value="false">禁用</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">开始时间 (可选)</label>
                <input
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">结束时间 (可选)</label>
                <input
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : (editingId ? '更新' : '创建')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无公告，点击上方按钮创建</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => {
            const typeOpt = typeOptions.find(t => t.value === announcement.type);
            return (
              <div key={announcement.id} className="rounded-xl border border-border bg-card p-4 flex items-start gap-4">
                <div className={`h-2 w-2 rounded-full mt-2 shrink-0 ${typeOpt?.color || 'bg-blue-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">{announcement.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${announcement.is_active ? 'bg-green-500/10 text-green-400' : 'bg-secondary text-muted-foreground'}`}>
                      {announcement.is_active ? '启用' : '禁用'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{announcement.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>类型: {typeOpt?.label || announcement.type}</span>
                    {announcement.start_date && <span>开始: {new Date(announcement.start_date).toLocaleDateString('zh-CN')}</span>}
                    {announcement.end_date && <span>结束: {new Date(announcement.end_date).toLocaleDateString('zh-CN')}</span>}
                    <span>创建: {new Date(announcement.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(announcement)}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      announcement.is_active
                        ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
                        : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    }`}
                  >
                    {announcement.is_active ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="text-xs px-2 py-1 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
