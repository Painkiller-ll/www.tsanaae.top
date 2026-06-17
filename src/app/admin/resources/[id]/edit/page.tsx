'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TYPE_LABELS: Record<string, string> = {
  study: '学习资料', movie: '影视剧', music: '音乐',
  game: '游戏', novel: '小说', software: '实用软件',
};

const TYPE_FIELDS: Record<string, Array<{ key: string; label: string; type?: string; placeholder?: string }>> = {
  study: [
    { key: 'format', label: '格式', placeholder: '如: PDF/视频/文档' },
    { key: 'duration', label: '时长', placeholder: '如: 10小时' },
    { key: 'level', label: '难度', placeholder: '如: 入门/中级/高级' },
  ],
  movie: [
    { key: 'director', label: '导演', placeholder: '导演名' },
    { key: 'cast', label: '主演', placeholder: '逗号分隔' },
    { key: 'episodes', label: '集数', type: 'number', placeholder: '如: 24' },
    { key: 'year', label: '年份', type: 'number', placeholder: '如: 2024' },
    { key: 'region', label: '地区', placeholder: '如: 日本/美国/中国' },
  ],
  music: [
    { key: 'artist', label: '艺人', placeholder: '艺人名' },
    { key: 'album', label: '专辑', placeholder: '专辑名' },
    { key: 'format', label: '格式', placeholder: '如: FLAC/MP3' },
    { key: 'track_count', label: '曲目数', type: 'number', placeholder: '如: 12' },
  ],
  game: [
    { key: 'developer', label: '开发商', placeholder: '开发商名' },
    { key: 'platform', label: '平台', placeholder: '如: PC/手机/网页' },
    { key: 'requirements', label: '配置要求', placeholder: '最低配置说明' },
  ],
  novel: [
    { key: 'word_count', label: '字数', placeholder: '如: 200万' },
    { key: 'status', label: '状态', placeholder: '如: 连载中/已完结' },
  ],
  software: [
    { key: 'version', label: '版本', placeholder: '如: 1.0.0' },
    { key: 'platform', label: '平台', placeholder: '如: Windows/Mac/Linux' },
    { key: 'size', label: '大小', placeholder: '如: 100MB' },
  ],
};

interface Category { id: number; name: string; slug: string; resource_type: string; parent_id: number | null; }

export default function EditResource({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    cover_url: '',
    resource_type: 'game',
    category_id: '',
    author: '',
    tags: '',
    unlock_points: 0,
    is_published: true,
    is_featured: false,
    extra_data: {} as Record<string, string>,
    download_links: [{ title: '下载链接', url: '', platform: '', is_free: true }],
  });

  useEffect(() => {
    loadResource();
  }, []);

  const loadResource = async () => {
    const token = document.cookie.split('admin_token=')[1]?.split(';')[0];
    const res = await fetch(`/api/admin/resources/${id}`, { });
    const data = await res.json();
    if (data.resource) {
      const r = data.resource;
      setForm({
        title: r.title || '',
        description: r.description || '',
        cover_url: r.cover_url || '',
        resource_type: r.resource_type || 'game',
        category_id: r.category_id ? String(r.category_id) : '',
        author: r.author || '',
        tags: (r.tags || []).join(', '),
        unlock_points: r.unlock_points || 0,
        is_published: r.is_published !== false,
        is_featured: r.is_featured || false,
        extra_data: Object.fromEntries(Object.entries(r.extra_data || {}).map(([k, v]) => [k, String(v)])),
        download_links: data.download_links?.length
          ? data.download_links.map((l: any) => ({ title: l.title || '', url: l.url || '', platform: l.platform || '', is_free: l.is_free !== false }))
          : [{ title: '下载链接', url: '', platform: '', is_free: true }],
      });
      fetchCategories(r.resource_type || 'game');
    }
    setLoading(false);
  };

  const fetchCategories = async (type: string) => {
    const res = await fetch(`/api/resource-categories?resource_type=${type}`);
    const data = await res.json();
    setCategories(data.categories || []);
  };

  const handleTypeChange = (type: string) => {
    setForm(f => ({ ...f, resource_type: type, category_id: '', extra_data: {} }));
    fetchCategories(type);
  };

  const updateExtra = (key: string, value: string) => {
    setForm(f => ({ ...f, extra_data: { ...f.extra_data, [key]: value } }));
  };

  const updateLink = (index: number, field: string, value: any) => {
    const links = [...form.download_links];
    links[index] = { ...links[index], [field]: value };
    setForm(f => ({ ...f, download_links: links }));
  };

  const addLink = () => {
    setForm(f => ({ ...f, download_links: [...f.download_links, { title: '下载链接', url: '', platform: '', is_free: true }] }));
  };

  const removeLink = (index: number) => {
    setForm(f => ({ ...f, download_links: f.download_links.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('请输入资源标题');
    setSaving(true);

    try {
      const token = document.cookie.split('admin_token=')[1]?.split(';')[0];
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
      const extraData: Record<string, any> = {};
      for (const [k, v] of Object.entries(form.extra_data)) {
        const fieldDef = TYPE_FIELDS[form.resource_type]?.find(f => f.key === k);
        extraData[k] = fieldDef?.type === 'number' ? (parseInt(v) || 0) : v;
      }

      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags,
          category_id: form.category_id ? parseInt(form.category_id) : null,
          extra_data: extraData,
          download_links: form.download_links.filter(l => l.url.trim()),
        }),
      });

      const data = await res.json();
      if (data.error) {
        alert('保存失败: ' + data.error);
      } else {
        alert('保存成功！');
        router.push('/admin/resources');
      }
    } catch {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  const typeFields = TYPE_FIELDS[form.resource_type] || [];
  const subCategories = categories.filter(c => c.parent_id !== null);
  const parentCategories = categories.filter(c => c.parent_id === null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/resources" className="text-gray-500 hover:text-gray-700">← 返回</Link>
        <h1 className="text-2xl font-bold text-gray-900">编辑资源</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Section title="基本信息">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="资源标题" required>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" />
            </Field>
            <Field label="资源类型" required>
              <select value={form.resource_type} onChange={e => handleTypeChange(e.target.value)} className="input">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="作者/开发商/艺人">
              <input type="text" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className="input" />
            </Field>
            <Field label="分类">
              <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="input">
                <option value="">选择分类</option>
                {subCategories.map(c => (
                  <option key={c.id} value={c.id}>{parentCategories.find(p => p.id === c.parent_id)?.name} / {c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="标签">
              <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="input" placeholder="逗号分隔" />
            </Field>
            <Field label="封面图URL">
              <input type="text" value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} className="input" />
            </Field>
            <Field label="解锁积分">
              <input type="number" value={form.unlock_points} onChange={e => setForm(f => ({ ...f, unlock_points: parseInt(e.target.value) || 0 }))} className="input" />
            </Field>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="rounded" /> 发布
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="rounded" /> 精选
              </label>
            </div>
          </div>
          <Field label="描述" className="mt-4">
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input min-h-[100px]" />
          </Field>
        </Section>

        {typeFields.length > 0 && (
          <Section title={`${TYPE_LABELS[form.resource_type]}专属信息`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {typeFields.map(f => (
                <Field key={f.key} label={f.label}>
                  <input type={f.type || 'text'} value={form.extra_data[f.key] || ''} onChange={e => updateExtra(f.key, e.target.value)} className="input" placeholder={f.placeholder || ''} />
                </Field>
              ))}
            </div>
          </Section>
        )}

        <Section title="下载链接">
          <div className="space-y-3">
            {form.download_links.map((link, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" value={link.title} onChange={e => updateLink(i, 'title', e.target.value)} className="input" placeholder="链接名称" />
                  <input type="text" value={link.url} onChange={e => updateLink(i, 'url', e.target.value)} className="input md:col-span-2" placeholder="下载地址" />
                  <select value={link.platform || ''} onChange={e => updateLink(i, 'platform', e.target.value)} className="input">
                    <option value="">全平台</option>
                    <option value="windows">Windows</option>
                    <option value="mac">Mac</option>
                    <option value="android">Android</option>
                    <option value="ios">iOS</option>
                  </select>
                </div>
                <label className="flex items-center gap-1 text-sm text-gray-600 mt-1 shrink-0">
                  <input type="checkbox" checked={link.is_free} onChange={e => updateLink(i, 'is_free', e.target.checked)} className="rounded" /> 免费
                </label>
                {form.download_links.length > 1 && (
                  <button type="button" onClick={() => removeLink(i)} className="text-red-400 hover:text-red-600 mt-1">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addLink} className="text-sm text-violet-600 hover:text-violet-800">+ 添加下载链接</button>
          </div>
        </Section>

        <div className="flex items-center gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium">
            {saving ? '保存中...' : '保存修改'}
          </button>
          <Link href="/admin/resources" className="px-4 py-2 text-gray-600 hover:text-gray-800">取消</Link>
        </div>
      </form>

      <style jsx>{`
        .input { width: 100%; border: 1px solid #d1d5db; border-radius: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; outline: none; transition: border-color 0.15s; }
        .input:focus { border-color: #7c3aed; box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1); }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, required, children, className = '' }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
