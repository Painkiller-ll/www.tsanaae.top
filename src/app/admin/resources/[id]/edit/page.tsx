'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { RESOURCE_TYPES, type ResourceType } from '@/lib/types';

interface Category {
  id: number;
  name: string;
  slug: string;
  resource_type: string;
  parent_id: number | null;
}

export default function AdminResourceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    cover_url: '',
    resource_type: 'game' as string,
    category_id: '',
    author: '',
    tags: [] as string[],
    unlock_points: 0,
    is_featured: false,
    is_published: true,
    extra_data: {} as Record<string, string>,
    download_links: [] as { title: string; url: string; platform: string; is_free: boolean }[],
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadCategories();
    loadResource();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/resource-categories');
      const data = await res.json();
      setCategories(data.data || data || []);
    } catch {}
  };

  const loadResource = async () => {
    try {
      const res = await fetch(`/api/admin/resources/${id}`);
      const { data } = await res.json();
      if (data) {
        setForm({
          title: data.title || '',
          description: data.description || '',
          cover_url: data.cover_url || '',
          resource_type: data.resource_type || 'game',
          category_id: data.category_id?.toString() || '',
          author: data.author || '',
          tags: data.tags || [],
          unlock_points: data.unlock_points || 0,
          is_featured: data.is_featured || false,
          is_published: data.is_published !== false,
          extra_data: data.extra_data || {},
          download_links: (data.downloads || []).map((d: any) => ({
            title: d.title || '下载链接',
            url: d.url || '',
            platform: d.platform || 'all',
            is_free: d.is_free !== false,
          })),
        });
      }
    } catch {} finally { setLoading(false); }
  };

  const filteredCategories = categories.filter(c => c.resource_type === form.resource_type);

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const handleAddDownloadLink = () => {
    setForm(f => ({
      ...f,
      download_links: [...f.download_links, { title: '下载链接', url: '', platform: 'all', is_free: true }],
    }));
  };

  const handleUpdateDownloadLink = (index: number, field: string, value: any) => {
    setForm(f => ({
      ...f,
      download_links: f.download_links.map((l, i) => i === index ? { ...l, [field]: value } : l),
    }));
  };

  const handleRemoveDownloadLink = (index: number) => {
    setForm(f => ({ ...f, download_links: f.download_links.filter((_, i) => i !== index) }));
  };

  const handleExtraDataChange = (key: string, value: string) => {
    setForm(f => ({ ...f, extra_data: { ...f.extra_data, [key]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('请输入标题');

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category_id: form.category_id ? parseInt(form.category_id) : null,
        }),
      });
      if (res.ok) {
        router.push('/admin/resources');
      } else {
        const err = await res.json();
        alert(err.error || '更新失败');
      }
    } catch {
      alert('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const typeConfig = RESOURCE_TYPES[form.resource_type as ResourceType];
  const extraFields: Record<ResourceType, { key: string; label: string; placeholder: string }[]> = {
    study: [
      { key: 'format', label: '格式', placeholder: '如：PDF、视频' },
      { key: 'duration', label: '时长', placeholder: '如：10小时' },
      { key: 'level', label: '难度', placeholder: '如：入门、进阶' },
    ],
    movie: [
      { key: 'director', label: '导演', placeholder: '导演名' },
      { key: 'cast', label: '主演', placeholder: '主演名，逗号分隔' },
      { key: 'episodes', label: '集数', placeholder: '如：24' },
      { key: 'year', label: '年份', placeholder: '如：2024' },
      { key: 'region', label: '地区', placeholder: '如：日本、美国' },
    ],
    music: [
      { key: 'artist', label: '艺人', placeholder: '艺人名' },
      { key: 'album', label: '专辑', placeholder: '专辑名' },
      { key: 'format', label: '格式', placeholder: '如：FLAC、MP3' },
      { key: 'track_count', label: '曲目数', placeholder: '如：12' },
    ],
    game: [
      { key: 'developer', label: '开发商', placeholder: '开发商' },
      { key: 'platform', label: '平台', placeholder: '如：PC、手机、网页' },
      { key: 'requirements', label: '配置要求', placeholder: '最低配置描述' },
    ],
    novel: [
      { key: 'word_count', label: '字数', placeholder: '如：200万' },
      { key: 'status', label: '状态', placeholder: '如：连载中、已完结' },
    ],
    software: [
      { key: 'version', label: '版本', placeholder: '如：1.0' },
      { key: 'platform', label: '平台', placeholder: '如：Windows、Mac' },
      { key: 'size', label: '大小', placeholder: '如：100MB' },
    ],
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">加载中...</div>;

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground mb-6">编辑资源</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* 基本信息 */}
        <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground">基本信息</h2>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">资源类型 *</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(RESOURCE_TYPES) as [ResourceType, typeof RESOURCE_TYPES[ResourceType]][]).map(([key, config]) => (
                <button key={key} type="button" onClick={() => setForm(f => ({ ...f, resource_type: key }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                  style={form.resource_type === key
                    ? { backgroundColor: config.color, color: '#fff', borderColor: config.color }
                    : { borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                  {config.icon} {config.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">标题 *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">作者/开发商/艺人</label>
            <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">子分类</label>
            <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary">
              <option value="">不选择</option>
              {filteredCategories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">描述</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary resize-none" />
          </div>

          <div>
            <label className="block text-xs text-muted-foreground mb-1">封面图URL</label>
            <input value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary" placeholder="https://..." />
          </div>
        </div>

        {/* 类型特有字段 */}
        <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground">{typeConfig?.icon} {typeConfig?.label}详情</h2>
          <div className="grid grid-cols-2 gap-4">
            {(extraFields[form.resource_type as ResourceType] || []).map(field => (
              <div key={field.key}>
                <label className="block text-xs text-muted-foreground mb-1">{field.label}</label>
                <input
                  value={form.extra_data[field.key] || ''}
                  onChange={e => handleExtraDataChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 标签 */}
        <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground">标签</h2>
          <div className="flex gap-2">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-primary"
              placeholder="输入标签后回车" />
            <button type="button" onClick={handleAddTag}
              className="px-3 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90">添加</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary/20 text-primary">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-400">&times;</button>
              </span>
            ))}
          </div>
        </div>

        {/* 下载链接 */}
        <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">下载链接</h2>
            <button type="button" onClick={handleAddDownloadLink}
              className="text-xs text-primary hover:underline">+ 添加链接</button>
          </div>
          {form.download_links.map((link, i) => (
            <div key={i} className="flex gap-2 items-end p-3 rounded-lg bg-background border border-border">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">标题</label>
                <input value={link.title} onChange={e => handleUpdateDownloadLink(i, 'title', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-card border border-border text-foreground text-xs" />
              </div>
              <div className="flex-[2]">
                <label className="block text-xs text-muted-foreground mb-1">链接URL</label>
                <input value={link.url} onChange={e => handleUpdateDownloadLink(i, 'url', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-card border border-border text-foreground text-xs" placeholder="https://..." />
              </div>
              <div className="w-24">
                <label className="block text-xs text-muted-foreground mb-1">平台</label>
                <select value={link.platform} onChange={e => handleUpdateDownloadLink(i, 'platform', e.target.value)}
                  className="w-full px-2 py-1.5 rounded bg-card border border-border text-foreground text-xs">
                  <option value="all">全部</option>
                  <option value="windows">Windows</option>
                  <option value="mac">Mac</option>
                  <option value="android">Android</option>
                  <option value="ios">iOS</option>
                </select>
              </div>
              <div className="flex items-center gap-1 pb-1">
                <input type="checkbox" checked={link.is_free} onChange={e => handleUpdateDownloadLink(i, 'is_free', e.target.checked)}
                  className="rounded" />
                <span className="text-xs text-muted-foreground">免费</span>
              </div>
              <button type="button" onClick={() => handleRemoveDownloadLink(i)}
                className="text-red-400 text-sm pb-1.5">&times;</button>
            </div>
          ))}
        </div>

        {/* 设置 */}
        <div className="space-y-4 p-5 rounded-xl border border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground">设置</h2>
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">解锁所需积分 (0=免费)</label>
              <input type="number" value={form.unlock_points} min={0}
                onChange={e => setForm(f => ({ ...f, unlock_points: parseInt(e.target.value) || 0 }))}
                className="w-32 px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                className="rounded" />
              <span className="text-sm text-foreground">精选推荐</span>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
                className="rounded" />
              <span className="text-sm text-foreground">发布</span>
            </div>
          </div>
        </div>

        {/* 提交 */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saving ? '保存中...' : '保存修改'}
          </button>
          <button type="button" onClick={() => router.push('/admin/resources')}
            className="px-6 py-2.5 rounded-lg border border-border text-muted-foreground text-sm hover:text-foreground">
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
