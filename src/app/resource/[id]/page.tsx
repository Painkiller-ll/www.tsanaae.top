'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import ResourceCard from '@/components/ResourceCard';
import { type Resource, type ResourceCategory, type Comment } from '@/lib/types';

const PAGE_SIZE = 12;

export default function ResourceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [resource, setResource] = useState<Resource | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [userScore, setUserScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [relatedResources, setRelatedResources] = useState<Resource[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<ResourceCategory | null>(null);
  const [allCategories, setAllCategories] = useState<ResourceCategory[]>([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resRes, comRes] = await Promise.all([
        fetch(`/api/resources/${id}`),
        fetch(`/api/resources/${id}/comments`),
      ]);
      const resData = await resRes.json();
      const comData = await comRes.json();
      if (resData.data) {
        setResource(resData.data);
        setUserScore(resData.data.user_rating || 0);
      }
      if (comData.data) setComments(comData.data);
    } catch {}
    setLoading(false);
  };

  // 加载分类信息和相关资源
  useEffect(() => {
    if (!resource) return;
    // 获取分类信息
    fetch('/api/resource-categories?top_level=true')
      .then(r => r.json())
      .then(d => {
        const cats: ResourceCategory[] = d.data || [];
        setAllCategories(cats);
        const cat = cats.find((c: ResourceCategory) => c.slug === resource.resource_type);
        if (cat) setCategoryInfo(cat);
      })
      .catch(() => {});
    // 获取相关资源
    fetch(`/api/resources?type=${resource.resource_type}&limit=6`)
      .then(r => r.json())
      .then(d => setRelatedResources((d.data || []).filter((r: Resource) => r.id !== resource.id)))
      .catch(() => {});
  }, [resource?.resource_type, resource?.id]);

  const handleRate = async (score: number) => {
    const res = await fetch(`/api/resources/${id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ score }),
    });
    if (res.ok) { setUserScore(score); loadData(); }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/resources/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: commentText.trim(), author_name: commentName.trim() || '匿名用户' }),
    });
    if (res.ok) {
      setCommentText('');
      setCommentName('');
      alert('评论已提交，等待审核后显示');
    } else {
      const data = await res.json();
      alert(data.error || '评论失败');
    }
  };

  const getCategoryLabel = () => categoryInfo?.name || resource?.resource_type || '';
  const getCategoryIcon = () => categoryInfo?.icon || '📁';
  const getCategoryColor = () => categoryInfo?.color || '#6366f1';

  const getAuthorLabel = () => {
    const slug = resource?.resource_type;
    if (slug === 'movie' || slug === 'tv-series' || slug === 'anime' || slug === 'variety') return '导演';
    if (slug === 'novel') return '作者';
    if (slug === 'music') return '艺人';
    return '开发商';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/5 rounded w-1/3 mx-auto" />
            <div className="h-64 bg-white/5 rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h1 className="text-xl text-foreground">资源不存在</h1>
          <a href="/" className="text-primary hover:underline text-sm mt-2 inline-block">返回首页</a>
        </main>
      </div>
    );
  }

  const extra = resource.extra_data as Record<string, string>;

  // extra_data key 中文映射
  const keyLabelMap: Record<string, string> = {
    director: '导演', developer: '开发商', author: '作者', artist: '艺人',
    platform: '平台', version: '版本', size: '大小', language: '语言',
    duration: '时长', episodes: '集数', season: '季数', genre: '类型',
    publisher: '发行商', release_date: '发行日期', rating: '评分',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title={resource.title}
          breadcrumbs={[
            { label: '首页', href: '/' },
            { label: getCategoryLabel(), href: `/resources/${resource.resource_type}` },
            { label: resource.title },
          ]}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：封面+信息 */}
          <div className="lg:col-span-1">
            {/* 封面 */}
            <div className="rounded-xl overflow-hidden bg-card border border-border">
              {resource.cover_url ? (
                <img src={resource.cover_url} alt={resource.title} className="w-full aspect-[3/4] object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] flex items-center justify-center bg-white/5">
                  <span className="text-6xl">{getCategoryIcon()}</span>
                </div>
              )}
            </div>

            {/* 评分 */}
            <div className="mt-4 p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-medium text-foreground mb-2">评分</h3>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => handleRate(s)} className="p-0.5">
                    <svg className={`h-6 w-6 transition-colors ${s <= userScore ? 'text-yellow-400' : 'text-white/20'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {resource.avg_rating.toFixed(1)} ({resource.rating_count}人评)
                </span>
              </div>
            </div>
          </div>

          {/* 右侧：详情 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 基本信息 */}
            <div className="p-5 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-bold text-foreground">{resource.title}</h1>
                  {resource.author && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {getAuthorLabel()}：{resource.author}
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getCategoryColor() }}
                >
                  {getCategoryIcon()} {getCategoryLabel()}
                </span>
              </div>

              {/* 标签 */}
              {resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {resource.tags.map((tag, i) => {
                    const tagStr = typeof tag === 'string' ? tag : tag.name;
                    return (
                      <a key={typeof tag === 'string' ? i : tag.id} href={`/search?q=${tagStr}&type=${resource.resource_type}`} className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground transition-colors">
                        {tagStr}
                      </a>
                    );
                  })}
                </div>
              )}

              {resource.description && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed whitespace-pre-wrap">{resource.description}</p>
              )}

              {/* 下载链接 - 如果有 download_url */}
              {resource.download_url && (
                <div className="mt-4">
                  <a
                    href={resource.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/80 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载资源
                  </a>
                </div>
              )}
            </div>

            {/* 类型特有信息 */}
            {Object.keys(extra).length > 0 && (
              <div className="p-5 rounded-xl bg-card border border-border">
                <h2 className="text-sm font-semibold text-foreground mb-3">详细信息</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(extra).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-xs text-muted-foreground">{keyLabelMap[key] || key}</span>
                      <p className="text-sm text-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 下载链接 - 旧版 download_links */}
            {resource.download_links && resource.download_links.length > 0 && (
              <div className="p-5 rounded-xl bg-card border border-border">
                <h2 className="text-sm font-semibold text-foreground mb-3">下载链接</h2>
                <div className="space-y-2">
                  {resource.download_links.map((dl, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border">
                      <div>
                        <p className="text-sm text-foreground">{dl.title}</p>
                        {dl.platform && <p className="text-xs text-muted-foreground">{dl.platform}</p>}
                      </div>
                      <a href={dl.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/80 transition-colors">
                        下载
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 评论区 */}
            <div className="p-5 rounded-xl bg-card border border-border">
              <h2 className="text-sm font-semibold text-foreground mb-4">评论 ({comments.length})</h2>

              {/* 发评论 - 不需要登录 */}
              <div className="mb-4 space-y-2">
                <div className="flex gap-2">
                  <input
                    value={commentName}
                    onChange={e => setCommentName(e.target.value)}
                    placeholder="你的昵称（选填）"
                    className="w-32 h-9 rounded-lg bg-white/5 border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="说点什么..."
                    className="flex-1 h-9 rounded-lg bg-white/5 border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                  />
                  <button onClick={handleComment} className="px-4 h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/80 transition-colors">
                    发送
                  </button>
                </div>
              </div>

              {/* 评论列表 */}
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-white/[0.02] border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {(c.author_name || '匿')[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-foreground">{c.author_name || '匿名用户'}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground pl-8">{c.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">暂无评论，快来发表第一条吧</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 相关资源 */}
        {relatedResources.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-foreground mb-4">相关推荐</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedResources.map(r => <ResourceCard key={r.id} resource={r} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
