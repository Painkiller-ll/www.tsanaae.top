'use client';

import { useEffect, useState } from 'react';
import { Game, Comment } from '@/lib/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function GameDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    } catch {
      // ignore
    }
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
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

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
                <img
                  src={game.cover_image}
                  alt={game.title}
                  className="w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-xl border border-border/50 bg-card">
                <svg className="h-16 w-16 text-muted-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
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
                  <Link
                    key={tag.id}
                    href={`/search?tag=${encodeURIComponent(tag.name)}`}
                    className="tag-pill"
                  >
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
            </div>

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
          </div>
        </div>

        {/* Description */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            📖 游戏详情
          </h2>
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {game.description || '暂无详情'}
            </p>
          </div>
        </section>

        {/* System Requirements */}
        {(game.min_specs || game.rec_specs) && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              ⚙️ 系统配置
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.min_specs && (
                <div className="rounded-xl border border-border/50 bg-card p-6">
                  <h3 className="font-semibold text-foreground mb-3">最低配置</h3>
                  <ul className="space-y-2 text-sm">
                    {Object.entries(game.min_specs).map(([key, value]) => (
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
                    {Object.entries(game.rec_specs).map(([key, value]) => (
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

        {/* Related Games */}
        {game.related_games && game.related_games.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">相关推荐</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {game.related_games.map((rg) => (
                <Link key={rg.id} href={`/game/${rg.id}`} className="game-card block group">
                  <div className="overflow-hidden rounded-lg border border-border/50 bg-card">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {rg.cover_image ? (
                        <img
                          src={rg.cover_image}
                          alt={rg.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary">
                          <svg className="h-8 w-8 text-muted-foreground/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <h3 className="truncate text-xs font-medium text-foreground">{rg.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            💬 评论区
            <span className="text-sm text-muted-foreground font-normal">全部评论 ({comments.length})</span>
          </h2>

          {/* Comment Form */}
          <div className="rounded-xl border border-border/50 bg-card p-6 mb-6">
            <form onSubmit={handleComment} className="space-y-3">
              <input
                type="text"
                placeholder="你的昵称"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                required
              />
              <textarea
                placeholder="写下你的评论..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-secondary/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? '提交中...' : '发表评论'}
              </button>
            </form>
          </div>

          {/* Comment List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无评论，快来抢沙发吧</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-xl border border-border/50 bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs text-primary font-bold">
                      {comment.nickname.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{comment.nickname}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString('zh-CN')}
                    </span>
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
