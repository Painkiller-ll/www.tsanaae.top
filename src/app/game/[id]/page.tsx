'use client';

import { useEffect, useState, useCallback } from 'react';
import { Game, Comment } from '@/lib/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface DownloadLink {
  label: string;
  url: string;
  type: string;
}

export default function GameDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    fetch('/api/user/auth/check').then(r => r.json()).then(d => setLoggedIn(!!d.user)).catch(() => {});
  }, []);

  // Check favorite status
  useEffect(() => {
    if (!id || !loggedIn) return;
    fetch(`/api/user/favorites?game_id=${id}`).then(r => r.json()).then(d => setFavorited(!!d.favorited)).catch(() => {});
  }, [id, loggedIn]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/games/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.game) {
          setGame(data.game);
          setComments(data.game.comments || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (liked || !game) return;
    try {
      const res = await fetch(`/api/games/${game.id}/like`, { method: 'POST' });
      const data = await res.json();
      if (data.likes !== undefined) {
        setGame({ ...game, likes: data.likes });
        setLiked(true);
      }
    } catch { /* ignore */ }
  };

  const handleFavorite = async () => {
    if (!loggedIn) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: id }),
      });
      const data = await res.json();
      setFavorited(data.favorited);
    } catch { /* ignore */ }
  };

  const handleDownload = async (link: DownloadLink) => {
    // Increment download count
    try {
      await fetch(`/api/games/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ increment_download: true }) });
    } catch { /* ignore */ }
    window.open(link.url, '_blank');
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/games/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), content: content.trim() }),
      });
      const data = await res.json();
      if (data.comment) {
        setComments([data.comment, ...comments]);
        setContent('');
      }
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  // Parse download links and screenshots
  const downloadLinks: DownloadLink[] = game?.download_links ? (typeof game.download_links === 'string' ? JSON.parse(game.download_links) : game.download_links) : [];
  const screenshots: string[] = game?.screenshots ? (typeof game.screenshots === 'string' ? JSON.parse(game.screenshots) : game.screenshots) : [];

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 bg-secondary rounded" />
            <div className="h-80 bg-secondary rounded-xl" />
            <div className="h-6 w-64 bg-secondary rounded" />
            <div className="h-24 bg-secondary rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">游戏未找到</p>
          <Link href="/" className="text-primary hover:underline">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Lightbox for screenshots */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setLightboxImg(null)}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <img src={lightboxImg} alt="截图" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Breadcrumb */}
      <div className="border-b border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">首页</Link>
            <span>/</span>
            {game.categories && (
              <>
                <Link href={`/games/${game.categories.slug}`} className="hover:text-foreground transition-colors">
                  {game.categories.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground">{game.title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Cover */}
          <div className="lg:col-span-2">
            {game.cover_image ? (
              <div className="overflow-hidden rounded-xl border border-border/50">
                <img src={game.cover_image} alt={game.title} className="w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-border/50 bg-card">
                <svg className="h-16 w-16 text-muted-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </div>
            )}

            {/* Screenshot Gallery */}
            {screenshots.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-foreground mb-3">游戏截图</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {screenshots.map((ss, i) => (
                    <div
                      key={i}
                      className="relative aspect-video rounded-lg overflow-hidden border border-border/50 cursor-pointer hover:border-primary/50 transition-colors group"
                      onClick={() => setLightboxImg(ss)}
                    >
                      <img src={ss} alt={`截图 ${i+1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <svg className="h-8 w-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs text-primary border border-primary/20 mb-3">
                {game.categories?.name || '游戏'}
              </span>
              <h1 className="text-2xl font-bold text-foreground">{game.title}</h1>
            </div>

            {/* Tags */}
            {game.tags && game.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {game.tags.map((tag) => (
                  <Link key={tag.id} href={`/search?tag=${encodeURIComponent(tag.name)}`} className="tag-pill">
                    {tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Meta Info */}
            <div className="space-y-2 text-sm">
              {game.developer && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">开发商:</span>
                  <span className="text-foreground">{game.developer}</span>
                </div>
              )}
              {game.publisher && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">发行商:</span>
                  <span className="text-foreground">{game.publisher}</span>
                </div>
              )}
              {game.release_date && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">发行日期:</span>
                  <span className="text-foreground">{game.release_date}</span>
                </div>
              )}
              {game.download_count > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">下载次数:</span>
                  <span className="text-foreground">{game.download_count}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Like */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
                  liked
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-border bg-card hover:border-red-500/30 hover:bg-card/80 text-muted-foreground hover:text-red-400'
                }`}
              >
                <svg className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {liked ? '已点赞' : '点赞'} {game.likes}
              </button>

              {/* Favorite */}
              <button
                onClick={handleFavorite}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all ${
                  favorited
                    ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                    : 'border-border bg-card hover:border-yellow-500/30 hover:bg-card/80 text-muted-foreground hover:text-yellow-400'
                }`}
              >
                <svg className="h-4 w-4" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {favorited ? '已收藏' : '收藏'}
              </button>
            </div>

            {/* Download Section */}
            {downloadLinks.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-foreground">下载资源</h3>
                {downloadLinks.map((link, i) => (
                  <button
                    key={i}
                    onClick={() => handleDownload(link)}
                    className="w-full flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 px-4 py-3 text-sm transition-colors group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      {link.type === 'pan' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      ) : link.type === 'magnet' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2v6a6 6 0 0 0 12 0V2" /><line x1="6" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="18" y2="6" /></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-foreground font-medium">{link.label}</div>
                    </div>
                    <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">📖 游戏详情</h2>
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{game.description || '暂无详情'}</p>
          </div>
        </section>

        {/* System Requirements */}
        {(game.min_specs || game.rec_specs) && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">⚙️ 系统配置</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.min_specs && (
                <div className="rounded-xl border border-border/50 bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-3">最低配置</h3>
                  <ul className="space-y-2 text-sm">
                    {Object.entries(game.min_specs as Record<string, string>).map(([key, value]) => (
                      <li key={key} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">{key}:</span>
                        <span className="text-foreground/80">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {game.rec_specs && (
                <div className="rounded-xl border border-border/50 bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-3">推荐配置</h3>
                  <ul className="space-y-2 text-sm">
                    {Object.entries(game.rec_specs as Record<string, string>).map(([key, value]) => (
                      <li key={key} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">{key}:</span>
                        <span className="text-foreground/80">{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Comments */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            💬 评论区
            <span className="text-sm text-muted-foreground font-normal">全部评论 ({comments.length})</span>
          </h2>
          <div className="rounded-xl border border-border/50 bg-card p-6 mb-6">
            <form onSubmit={handleComment} className="space-y-3">
              <input type="text" placeholder="你的昵称" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" required />
              <textarea placeholder="写下你的评论..." value={content} onChange={(e) => setContent(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" required />
              <button type="submit" disabled={submitting} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">{submitting ? '提交中...' : '发表评论'}</button>
            </form>
          </div>
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无评论，快来抢沙发吧</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-border/50 bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs text-primary font-bold">{comment.nickname.charAt(0).toUpperCase()}</div>
                    <span className="text-sm font-medium text-foreground">{comment.nickname}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <p className="text-sm text-foreground/80 pl-9">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
