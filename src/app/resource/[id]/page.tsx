'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import PageHeader from '@/components/PageHeader';
import ResourceCard from '@/components/ResourceCard';
import { RESOURCE_TYPES, type Resource, type ResourceType, type Comment } from '@/lib/types';

export default function ResourceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [resource, setResource] = useState<Resource | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [userScore, setUserScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['x-session'] = token;

    try {
      const [resRes, comRes] = await Promise.all([
        fetch(`/api/resources/${id}`, { headers }),
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

  const handleRate = async (score: number) => {
    const token = localStorage.getItem('user_token');
    if (!token) { alert('请先登录'); return; }
    const res = await fetch(`/api/resources/${id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session': token },
      body: JSON.stringify({ score }),
    });
    if (res.ok) { setUserScore(score); loadData(); }
  };

  const handleComment = async () => {
    const token = localStorage.getItem('user_token');
    if (!token) { alert('请先登录'); return; }
    if (!commentText.trim()) return;
    const res = await fetch(`/api/resources/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session': token },
      body: JSON.stringify({ content: commentText.trim() }),
    });
    if (res.ok) { setCommentText(''); loadData(); }
  };

  const handleFavorite = async () => {
    const token = localStorage.getItem('user_token');
    if (!token) { alert('请先登录'); return; }
    const res = await fetch('/api/user/favorites', {
      method: resource?.is_favorited ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session': token },
      body: JSON.stringify({ resource_id: parseInt(id) }),
    });
    if (res.ok) loadData();
  };

  const handleUnlock = async () => {
    const token = localStorage.getItem('user_token');
    if (!token) { alert('请先登录'); return; }
    const res = await fetch('/api/user/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-session': token },
      body: JSON.stringify({ resource_id: parseInt(id) }),
    });
    const data = await res.json();
    if (data.success) { loadData(); }
    else { alert(data.error || '解锁失败'); }
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

  const typeConfig = RESOURCE_TYPES[resource.resource_type as ResourceType];
  const extra = resource.extra_data as Record<string, string>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader
          title={resource.title}
          breadcrumbs={[
            { label: '首页', href: '/' },
            { label: typeConfig.label, href: `/resources/${resource.resource_type}` },
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
                  <span className="text-6xl">{typeConfig.icon}</span>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="mt-4 space-y-2">
              <button
                onClick={handleFavorite}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  resource.is_favorited
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                    : 'bg-white/5 text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {resource.is_favorited ? '已收藏' : '收藏'}
              </button>
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
                      {resource.resource_type === 'movie' ? '导演' : resource.resource_type === 'novel' ? '作者' : resource.resource_type === 'music' ? '艺人' : '开发商'}：{resource.author}
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: typeConfig.color }}
                >
                  {typeConfig.icon} {typeConfig.label}
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
            </div>

            {/* 类型特有信息 */}
            {Object.keys(extra).length > 0 && (
              <div className="p-5 rounded-xl bg-card border border-border">
                <h2 className="text-sm font-semibold text-foreground mb-3">详细信息</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(extra).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-xs text-muted-foreground">{key}</span>
                      <p className="text-sm text-foreground">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 下载链接 */}
            {resource.download_links && resource.download_links.length > 0 && (
              <div className="p-5 rounded-xl bg-card border border-border">
                <h2 className="text-sm font-semibold text-foreground mb-3">下载链接</h2>
                <div className="space-y-2">
                  {resource.download_links.map((dl, i) => {
                    const isLocked = !dl.is_free && !resource.is_unlocked;
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-border">
                        <div>
                          <p className="text-sm text-foreground">{dl.title}</p>
                          {dl.platform && <p className="text-xs text-muted-foreground">{dl.platform}</p>}
                        </div>
                        {isLocked ? (
                          <button onClick={handleUnlock} className="px-3 py-1.5 rounded-lg bg-yellow-500 text-black text-xs font-medium hover:bg-yellow-400 transition-colors">
                            {resource.unlock_points}积分解锁
                          </button>
                        ) : (
                          <a href={dl.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/80 transition-colors">
                            下载
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 评论区 */}
            <div className="p-5 rounded-xl bg-card border border-border">
              <h2 className="text-sm font-semibold text-foreground mb-4">评论 ({comments.length})</h2>

              {/* 发评论 */}
              <div className="flex gap-2 mb-4">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="说点什么..."
                  className="flex-1 h-9 rounded-lg bg-white/5 border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <button onClick={handleComment} className="px-4 h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/80 transition-colors">
                  发送
                </button>
              </div>

              {/* 评论列表 */}
              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-white/[0.02] border border-border/50">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {c.username[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-foreground">{c.username}</span>
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
      </main>
    </div>
  );
}
