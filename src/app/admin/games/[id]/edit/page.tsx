'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
}

interface GameData {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  cover_image?: string;
  category_id: string;
  developer?: string;
  publisher?: string;
  release_date?: string;
  platform: string;
  video_url?: string;
  download_url?: string;
  is_featured: boolean;
  min_specs?: Record<string, string>;
  rec_specs?: Record<string, string>;
  tags?: { id: string; name: string }[];
}

export default function EditGamePage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

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
    is_featured: false,
    min_specs: '' as string,
    rec_specs: '' as string,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [gameRes, catsRes, tagsRes] = await Promise.all([
          fetch(`/api/admin/games/${gameId}`),
          fetch('/api/admin/categories'),
          fetch('/api/admin/tags'),
        ]);

        const [gameData, catsData, tagsData] = await Promise.all([
          gameRes.json(),
          catsRes.json(),
          tagsRes.json(),
        ]);

        setCategories(catsData.categories || []);
        setTags(tagsData.tags || []);

        if (gameData.game) {
          const g: GameData = gameData.game;
          setForm({
            title: g.title || '',
            slug: g.slug || '',
            description: g.description || '',
            cover_image: g.cover_image || '',
            category_id: g.category_id || '',
            developer: g.developer || '',
            publisher: g.publisher || '',
            release_date: g.release_date || '',
            platform: g.platform || 'pc',
            video_url: g.video_url || '',
            download_url: g.download_url || '',
            is_featured: g.is_featured || false,
            min_specs: g.min_specs ? JSON.stringify(g.min_specs, null, 2) : '',
            rec_specs: g.rec_specs ? JSON.stringify(g.rec_specs, null, 2) : '',
          });
          setSelectedTags(g.tags?.map((t) => t.id) || []);
        }
      } catch {
        setError('加载游戏信息失败');
      } finally {
        setInitialLoading(false);
      }
    }

    if (gameId) loadData();
  }, [gameId]);

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

      const res = await fetch(`/api/admin/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/admin/games');
      } else {
        setError(data.error || '更新失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div className="text-muted-foreground">加载中...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">编辑游戏</h1>

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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">游戏描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">封面图片 URL</label>
              <input
                type="text"
                value={form.cover_image}
                onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">发行商</label>
              <input
                type="text"
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">视频 URL</label>
            <input
              type="text"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
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
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">推荐配置</label>
            <textarea
              value={form.rec_specs}
              onChange={(e) => setForm({ ...form, rec_specs: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-mono"
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

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存修改'}
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
