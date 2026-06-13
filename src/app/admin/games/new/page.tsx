'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
}

export default function NewGamePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    cover_image: '',
    category_id: '',
    developer: '',
    publisher: '',
    release_date: '',
    platform: 'pc',
    video_url: '',
    download_url: '',
    download_links: [] as { title: string; url: string; platform: string }[],
    screenshots: [] as string[],
    is_featured: false,
    unlock_points: 0,
    min_specs: '' as string,
    rec_specs: '' as string,
  });

  useEffect(() => {
    async function loadData() {
      const [catsRes, tagsRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/tags'),
      ]);
      const [catsData, tagsData] = await Promise.all([catsRes.json(), tagsRes.json()]);
      setCategories(catsData.categories || []);
      setTags(tagsData.tags || []);
    }
    loadData();
  }, []);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        ...form,
        tag_ids: selectedTags,
      };

      if (form.min_specs) {
        try {
          body.min_specs = JSON.parse(form.min_specs);
        } catch {
          body.min_specs = {};
        }
      } else {
        delete body.min_specs;
      }

      if (form.rec_specs) {
        try {
          body.rec_specs = JSON.parse(form.rec_specs);
        } catch {
          body.rec_specs = {};
        }
      } else {
        delete body.rec_specs;
      }

      if (!form.slug) {
        delete body.slug;
      }
      if (!form.cover_image) {
        delete body.cover_image;
      }
      if (!form.video_url) {
        delete body.video_url;
      }
      if (!form.download_url) {
        delete body.download_url;
      }
      if (form.download_links && form.download_links.length > 0) {
        body.download_links = form.download_links.filter((l: { title: string; url: string }) => l.url);
      } else {
        delete body.download_links;
      }
      if (form.screenshots && form.screenshots.length > 0) {
        body.screenshots = form.screenshots.filter((s: string) => s);
      } else {
        delete body.screenshots;
      }
      if (!form.developer) {
        delete body.developer;
      }
      if (!form.publisher) {
        delete body.publisher;
      }
      if (!form.release_date) {
        delete body.release_date;
      }
      if (form.unlock_points && form.unlock_points > 0) {
        body.unlock_points = form.unlock_points;
      } else {
        delete body.unlock_points;
      }
      if (!form.description) {
        delete body.description;
      }

      // Remove raw string fields
      delete (body as Record<string, unknown>).min_specs_string;
      delete (body as Record<string, unknown>).rec_specs_string;

      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/games');
      } else {
        setError(data.error || '添加失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">添加游戏</h1>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">基本信息</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">游戏名称 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">URL Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="例: cyberpunk-2077"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">游戏描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">封面图片 URL</label>
              <input
                type="text"
                value={form.cover_image}
                onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">分类 *</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="">请选择分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">开发商</label>
              <input
                type="text"
                value={form.developer}
                onChange={(e) => setForm({ ...form, developer: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">发行商</label>
              <input
                type="text"
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">发行日期</label>
              <input
                type="text"
                value={form.release_date}
                onChange={(e) => setForm({ ...form, release_date: e.target.value })}
                placeholder="2025-01-01"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">平台 *</label>
              <select
                value={form.platform}
                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              >
                <option value="pc">PC</option>
                <option value="mobile">手机</option>
                <option value="web">网页</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">精选推荐</label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="rounded border-border"
                />
                <span className="text-sm text-foreground">设为精选</span>
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">链接</h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">下载链接</label>
            <input
              type="text"
              value={form.download_url}
              onChange={(e) => setForm({ ...form, download_url: e.target.value })}
              placeholder="https://example.com/download"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">视频 URL</label>
            <input
              type="text"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://example.com/video.mp4"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">系统配置 (JSON)</h2>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">最低配置</label>
            <textarea
              value={form.min_specs}
              onChange={(e) => setForm({ ...form, min_specs: e.target.value })}
              rows={3}
              placeholder='{"操作系统": "Windows 10", "处理器": "Intel i5", "内存": "8GB"}'
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">推荐配置</label>
            <textarea
              value={form.rec_specs}
              onChange={(e) => setForm({ ...form, rec_specs: e.target.value })}
              rows={3}
              placeholder='{"操作系统": "Windows 11", "处理器": "Intel i7", "内存": "16GB"}'
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">标签</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">下载链接（多个）</h2>
          {form.download_links.map((link, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={link.title}
                onChange={(e) => {
                  const links = [...form.download_links];
                  links[idx] = { ...links[idx], title: e.target.value };
                  setForm({ ...form, download_links: links });
                }}
                placeholder="名称（如：百度网盘）"
                className="w-1/4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                value={link.url}
                onChange={(e) => {
                  const links = [...form.download_links];
                  links[idx] = { ...links[idx], url: e.target.value };
                  setForm({ ...form, download_links: links });
                }}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <select
                value={link.platform || ''}
                onChange={(e) => {
                  const links = [...form.download_links];
                  links[idx] = { ...links[idx], platform: e.target.value };
                  setForm({ ...form, download_links: links });
                }}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="netdisk">网盘</option>
                <option value="magnet">磁力链接</option>
                <option value="torrent">种子</option>
                <option value="direct">直链</option>
                <option value="other">其他</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  const links = form.download_links.filter((_, i) => i !== idx);
                  setForm({ ...form, download_links: links });
                }}
                className="text-red-400 hover:text-red-300 text-sm px-2"
              >
                删除
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm({ ...form, download_links: [...form.download_links, { title: '', url: '', platform: 'netdisk' }] })}
            className="text-sm text-primary hover:underline"
          >
            + 添加下载链接
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">游戏截图</h2>
          {form.screenshots.map((url, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  const shots = [...form.screenshots];
                  shots[idx] = e.target.value;
                  setForm({ ...form, screenshots: shots });
                }}
                placeholder="截图URL"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {url && (
                <img src={url} alt="" className="w-16 h-10 object-cover rounded border border-border" />
              )}
              <button
                type="button"
                onClick={() => {
                  const shots = form.screenshots.filter((_, i) => i !== idx);
                  setForm({ ...form, screenshots: shots });
                }}
                className="text-red-400 hover:text-red-300 text-sm px-2"
              >
                删除
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm({ ...form, screenshots: [...form.screenshots, ''] })}
            className="text-sm text-primary hover:underline"
          >
            + 添加截图
          </button>
        </div>

        {/* Unlock Points */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            解锁所需积分 <span className="text-muted-foreground">(0=免费)</span>
          </label>
          <input
            type="number"
            min="0"
            value={form.unlock_points}
            onChange={(e) => setForm({ ...form, unlock_points: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">设置大于0时，用户需消耗积分才能查看下载链接</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? '添加中...' : '添加游戏'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/games')}
            className="rounded-lg bg-muted px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
