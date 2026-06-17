'use client';

import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/admin-fetch';

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<Array<{ id: string; question: string; answer: string; sort_order: number; is_active: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: '', answer: '', sort_order: 0, is_active: true });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchFaqs = async () => {
    const res = await adminFetch('/api/admin/faqs');
    const data = await res.json();
    setFaqs(data.faqs || []);
    setLoading(false);
  };

  useEffect(() => { fetchFaqs(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await fetch(`/api/admin/faqs/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await adminFetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setForm({ question: '', answer: '', sort_order: 0, is_active: true });
    setEditingId(null);
    fetchFaqs();
  };

  const handleEdit = (faq: typeof faqs[0]) => {
    setForm({ question: faq.question, answer: faq.answer, sort_order: faq.sort_order, is_active: faq.is_active });
    setEditingId(faq.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此FAQ？')) return;
    await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
    fetchFaqs();
  };

  const toggleActive = async (faq: typeof faqs[0]) => {
    await fetch(`/api/admin/faqs/${faq.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...faq, is_active: !faq.is_active }),
    });
    fetchFaqs();
  };

  const inputClass = 'w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-purple-500';

  if (loading) return <div className="text-muted-foreground text-center py-20">加载中...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">FAQ管理</h1>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">{editingId ? '编辑FAQ' : '添加FAQ'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">问题 *</label>
            <input type="text" value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} className={inputClass} required />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">回答 *</label>
            <textarea value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} className={inputClass} rows={3} required />
          </div>
          <div className="flex gap-4 items-end">
            <div className="w-32">
              <label className="block text-sm text-muted-foreground mb-1">排序</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
              启用
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              {editingId ? '保存修改' : '添加FAQ'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm({ question: '', answer: '', sort_order: 0, is_active: true }); }} className="px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80">
                取消
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">FAQ列表 ({faqs.length})</h3>
        {faqs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">暂无FAQ</p>
        ) : (
          <div className="space-y-3">
            {faqs.map(faq => (
              <div key={faq.id} className="border border-border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">{faq.answer}</p>
                  </div>
                  <div className="flex gap-2 ml-4 shrink-0">
                    <button onClick={() => toggleActive(faq)} className={`px-2 py-1 text-xs rounded ${faq.is_active ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                      {faq.is_active ? '启用' : '禁用'}
                    </button>
                    <button onClick={() => handleEdit(faq)} className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded">编辑</button>
                    <button onClick={() => handleDelete(faq.id)} className="px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
