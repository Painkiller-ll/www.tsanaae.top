'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_COVERS } from '@/lib/types';
import { adminFetch, adminFetchJSON, safeJson } from '@/lib/admin-fetch';
import type { ResourceType } from '@/lib/types';
import PageHeader from '@/components/PageHeader';

interface TopCategory {
  id: number;
  name: string;
  slug: string;
  resource_type: string;
  icon: string | null;
  sort_order: number;
}

interface DownloadLink {
  title: string;
  url: string;
  platform: string;
  is_free: boolean;
}

interface Props {
  mode: 'new' | 'edit';
  resourceId?: number;
}

export default function ResourceForm({ mode, resourceId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Basic fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('game');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [unlockPoints, setUnlockPoints] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [sortOrder, setSortOrder] = useState(0);
  const [downloadLinks, setDownloadLinks] = useState<DownloadLink[]>([
    { title: '下载链接1', url: '', platform: '', is_free: true },
  ]);
  const [extraData, setExtraData] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);

  // 加载顶级分类（资源类型）
  useEffect(() => {
    fetch('/api/resource-categories?top_level=true')
      .then(r => r.json())
      .then(d => {
        if (d.data) setTopCategories(d.data.sort((a: TopCategory, b: TopCategory) => a.sort_order - b.sort_order));
      })
      .catch(() => {});
  }, []);

  // Load categories when type changes
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`/api/resource-categories?top_level=true&resource_type=${resourceType}`);
        const data = await safeJson<{ categories?: { id: number; name: string }[] }>(res);
        if (data.categories) {
          setCategories(data.categories.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
          setCategoryId(null);
        }
      } catch {}
    }
    loadCategories();
  }, [resourceType]);

  // Load existing resource for edit mode
  useEffect(() => {
    if (mode === 'edit' && resourceId) {
      async function load() {
        try {
          const res = await fetch(`/api/resources/${resourceId}`);
          const result = await safeJson<Record<string, any>>(res);
          // API returns { data: { ...resource } }
          const r = result.data || result.resource || result;
          if (r && typeof r === 'object') {
            setTitle(r.title || '');
            setDescription(r.description || '');
            setCoverUrl(r.cover_url || '');
            setResourceType(r.resource_type || 'game');
            setCategoryId(r.category_id || null);
            setAuthor(r.author || '');
            setTags(Array.isArray(r.tags) ? r.tags.join(', ') : (r.tags || ''));
            setUnlockPoints(r.unlock_points || 0);
            setIsFeatured(r.is_featured || false);
            setIsPublished(r.is_published ?? true);
            setAvgRating(r.avg_rating ?? 0);
            setRatingCount(r.rating_count ?? 0);
            setSortOrder(r.sort_order ?? 0);
            // download_links from resource_downloads table or extra_data
            const links = r.download_links || r.downloads || [];
            if (Array.isArray(links) && links.length > 0) {
              setDownloadLinks(
                links.map((l: Record<string, any>) => ({
                  title: l.title || l.name || '',
                  url: l.url || '',
                  platform: l.platform || '',
                  is_free: l.is_free ?? true,
                }))
              );
            }
            if (r.extra_data && typeof r.extra_data === 'object') {
              const ed: Record<string, string> = {};
              for (const [k, v] of Object.entries(r.extra_data)) {
                ed[k] = String(v);
              }
              setExtraData(ed);
            }
          }
        } catch (err) {
          console.error('Failed to load resource:', err);
        }
      }
      load();
    }
  }, [mode, resourceId]);

  // Image upload handler
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { ok, status, data } = await adminFetchJSON<{ url?: string; error?: string }>('/api/upload', { method: 'POST', body: formData });
      if (ok && data.url) {
        setCoverUrl(data.url);
      } else {
        const errData = data as { error?: string; raw?: string };
        alert(`上传失败: ${errData.error || '未知错误'} (HTTP ${status})${errData.raw ? '\n原始响应: ' + errData.raw.substring(0, 200) : ''}`);
      }
    } catch (err) {
      alert(`上传失败: ${err instanceof Error ? err.message : '网络错误'}`);
    } finally {
      setUploading(false);
    }
  }

  // Type-specific fields
  const typeFields: Record<string, { key: string; label: string; placeholder: string }[]> = {
    movie: [
      { key: 'director', label: '导演', placeholder: '如：宫崎骏' },
      { key: 'cast', label: '主演/声优', placeholder: '如：柊瑠美, 入野自由' },
      { key: 'episodes', label: '集数', placeholder: '如：24' },
      { key: 'year', label: '年份', placeholder: '如：2024' },
      { key: 'region', label: '地区', placeholder: '如：日本/美国/中国' },
    ],
    music: [
      { key: 'artist', label: '艺人', placeholder: '如：周杰伦' },
      { key: 'album', label: '专辑', placeholder: '如：范特西' },
      { key: 'format', label: '格式', placeholder: '如：FLAC/MP3/320K' },
      { key: 'track_count', label: '曲目数', placeholder: '如：12' },
    ],
    game: [
      { key: 'developer', label: '开发商', placeholder: '如：FromSoftware' },
      { key: 'platform', label: '平台', placeholder: '如：PC/PS5/Switch' },
      { key: 'requirements', label: '配置要求', placeholder: '如：RTX 3060 / 16GB RAM' },
    ],
    novel: [
      { key: 'author', label: '作者', placeholder: '如：天蚕土豆' },
      { key: 'word_count', label: '字数', placeholder: '如：200万字' },
      { key: 'status', label: '状态', placeholder: '如：连载中/已完结' },
    ],
    software: [
      { key: 'version', label: '版本', placeholder: '如：2024.1' },
      { key: 'platform', label: '平台', placeholder: '如：Windows/Mac/Linux' },
      { key: 'size', label: '大小', placeholder: '如：100MB' },
    ],
    study: [
      { key: 'format', label: '格式', placeholder: '如：PDF/视频/课程' },
      { key: 'duration', label: '时长', placeholder: '如：10小时' },
      { key: 'level', label: '难度', placeholder: '如：入门/中级/高级' },
    ],
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { alert('请输入标题'); return; }

    setSaving(true);
    try {
      const tagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
      const currentFields = typeFields[resourceType] || [];
      const extra: Record<string, string> = {};
      for (const f of currentFields) {
        if (extraData[f.key]) extra[f.key] = extraData[f.key];
      }

      const body = {
        title: title.trim(),
        description: description.trim(),
        cover_url: coverUrl.trim() || DEFAULT_COVERS[resourceType] || '',
        resource_type: resourceType,
        category_id: categoryId,
        author: author.trim(),
        tags: tagsArr,
        unlock_points: unlockPoints,
        is_featured: isFeatured,
        is_published: isPublished,
        avg_rating: avgRating,
        rating_count: ratingCount,
        sort_order: sortOrder,
        extra_data: extra,
        download_links: downloadLinks.filter(l => l.url.trim()),
      };

      const url = mode === 'edit' ? `/api/admin/resources/${resourceId}` : '/api/admin/resources';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const { ok, status, data } = await adminFetchJSON<{ resource?: unknown; error?: string; raw?: string }>(url, {
        method,
        body: JSON.stringify(body),
      });

      if (ok) {
        router.push('/admin/resources');
      } else {
        const errData = data as { error?: string; raw?: string };
        alert(`保存失败: ${errData.error || '未知错误'} (HTTP ${status})${errData.raw ? '\n原始响应: ' + errData.raw.substring(0, 200) : ''}`);
        console.error('Save failed:', status, data);
      }
    } catch (err) {
      alert(`保存失败: ${err instanceof Error ? err.message : '网络错误'}`);
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  }

  function addDownloadLink() {
    setDownloadLinks([...downloadLinks, { title: `下载链接${downloadLinks.length + 1}`, url: '', platform: '', is_free: true }]);
  }

  function removeDownloadLink(idx: number) {
    setDownloadLinks(downloadLinks.filter((_, i) => i !== idx));
  }

  function updateDownloadLink(idx: number, field: keyof DownloadLink, value: string | boolean) {
    const updated = [...downloadLinks];
    (updated[idx] as unknown as Record<string, string | boolean>)[field] = value;
    setDownloadLinks(updated);
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={mode === 'edit' ? '编辑资源' : '新增资源'}
        breadcrumbs={[{ label: '管理后台', href: '/admin' }, { label: '资源管理', href: '/admin/resources' }, { label: mode === 'edit' ? '编辑' : '新增' }]}
      />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息卡片 */}
          <div className="bg-card rounded-xl p-6 border border-border space-y-5">
            <h3 className="text-lg font-semibold text-foreground">基本信息</h3>

            {/* 资源类型 - 动态从数据库读取 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">资源类型 *</label>
              <div className="flex flex-wrap gap-2">
                {topCategories.map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setResourceType(cat.resource_type || cat.slug)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      resourceType === (cat.resource_type || cat.slug)
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {cat.icon || '📁'} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">标题 *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="输入资源标题"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* 作者/开发商 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">作者 / 开发商 / 艺人</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="如：宫崎骏 / FromSoftware / 周杰伦"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* 分类 */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">子分类</label>
                <select
                  value={categoryId ?? ''}
                  onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">选择分类（可选）</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">标签</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="用逗号分隔，如：动作, RPG, 开放世界"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">描述</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="输入资源描述..."
                rows={4}
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y"
              />
            </div>
          </div>

          {/* 封面图卡片 */}
          <div className="bg-card rounded-xl p-6 border border-border space-y-5">
            <h3 className="text-lg font-semibold text-foreground">封面图片</h3>

            {/* 预览 */}
            {coverUrl && (
              <div className="relative w-full max-w-xs aspect-[3/2] rounded-lg overflow-hidden border border-border">
                <img src={coverUrl} alt="封面预览" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverUrl('')}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            )}

            {/* 上传按钮 */}
            <div className="flex flex-wrap gap-3">
              <label className={`cursor-pointer px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                uploading ? 'bg-muted text-muted-foreground' : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}>
                {uploading ? '上传中...' : '📁 上传图片'}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            </div>

            {/* 外链输入 */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">或输入图片链接</label>
              <input
                type="text"
                value={coverUrl}
                onChange={e => setCoverUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* 默认封面选择 - 动态从分类获取 */}
            {Object.keys(DEFAULT_COVERS).length > 0 && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">或选择默认封面</label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(DEFAULT_COVERS).map(([key, url]) => {
                    const matchedCat = topCategories.find(c => c.slug === key || c.resource_type === key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCoverUrl(url)}
                        className={`relative w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          coverUrl === url ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-border hover:border-muted-foreground/50'
                        }`}
                      >
                        <img src={url} alt={matchedCat?.name || key} className="w-full h-full object-cover" />
                        <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[10px] py-0.5 text-center">
                          {matchedCat?.icon || '📁'} {matchedCat?.name || key}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 类型特有字段 */}
          {(typeFields[resourceType] || []).length > 0 && (
            <div className="bg-card rounded-xl p-6 border border-border space-y-5">
              <h3 className="text-lg font-semibold text-foreground">
                {topCategories.find(c => c.resource_type === resourceType || c.slug === resourceType)?.icon || '📁'} {topCategories.find(c => c.resource_type === resourceType || c.slug === resourceType)?.name || resourceType}信息
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(typeFields[resourceType] || []).map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
                    <input
                      type="text"
                      value={extraData[field.key] || ''}
                      onChange={e => setExtraData({ ...extraData, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 下载链接 */}
          <div className="bg-card rounded-xl p-6 border border-border space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">下载链接</h3>
              <button
                type="button"
                onClick={addDownloadLink}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition"
              >
                + 添加链接
              </button>
            </div>

            {downloadLinks.map((link, idx) => (
              <div key={idx} className="p-4 bg-background rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">链接 {idx + 1}</span>
                  {downloadLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDownloadLink(idx)}
                      className="text-red-400 text-sm hover:text-red-300"
                    >
                      删除
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={link.title}
                    onChange={e => updateDownloadLink(idx, 'title', e.target.value)}
                    placeholder="链接名称"
                    className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <input
                    type="text"
                    value={link.url}
                    onChange={e => updateDownloadLink(idx, 'url', e.target.value)}
                    placeholder="下载地址 (https://...)"
                    className="px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={link.platform}
                      onChange={e => updateDownloadLink(idx, 'platform', e.target.value)}
                      placeholder="平台 (如Windows)"
                      className="flex-1 px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <label className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
                      <input
                        type="checkbox"
                        checked={link.is_free}
                        onChange={e => updateDownloadLink(idx, 'is_free', e.target.checked)}
                        className="rounded"
                      />
                      免费
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 发布设置 */}
          <div className="bg-card rounded-xl p-6 border border-border space-y-5">
            <h3 className="text-lg font-semibold text-foreground">发布设置</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">解锁积分</label>
                <input
                  type="number"
                  value={unlockPoints}
                  onChange={e => setUnlockPoints(Number(e.target.value))}
                  min={0}
                  placeholder="0=免费"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs text-muted-foreground mt-1">0 表示免费资源</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={e => setIsPublished(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">立即发布</span>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">设为精选</span>
                </label>
              </div>
            </div>
          </div>

          {/* 评分与排序 */}
          <div className="bg-card rounded-xl p-6 border border-border space-y-5">
            <h3 className="text-lg font-semibold text-foreground">评分与排序</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">评分</label>
                <input
                  type="number"
                  value={avgRating}
                  onChange={e => setAvgRating(Number(e.target.value))}
                  min={0}
                  max={5}
                  step={0.1}
                  placeholder="0-5"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs text-muted-foreground mt-1">0~5 分，支持小数</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">评分人数</label>
                <input
                  type="number"
                  value={ratingCount}
                  onChange={e => setRatingCount(Number(e.target.value))}
                  min={0}
                  placeholder="如：128"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs text-muted-foreground mt-1">评价人数，越大越热门</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">排序权重</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={e => setSortOrder(Number(e.target.value))}
                  min={0}
                  placeholder="0=默认"
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs text-muted-foreground mt-1">数值越大排越前，0 为正常排序</span>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pb-8">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {saving ? '保存中...' : mode === 'edit' ? '保存修改' : '创建资源'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin/resources')}
              className="px-8 py-3 bg-muted text-muted-foreground font-medium rounded-lg hover:bg-muted/80 transition"
            >
              取消
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
