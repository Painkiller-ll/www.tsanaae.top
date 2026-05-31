'use client';

import { useEffect, useState } from 'react';

interface Comment {
  id: string;
  game_id: string;
  nickname: string;
  content: string;
  created_at: string;
  games?: { id: string; title: string } | null;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      const res = await fetch('/api/admin/comments');
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此评论吗？')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
      setComments(comments.filter((c) => c.id !== id));
    } catch {
      alert('删除失败');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">评论管理</h1>
        <div className="text-sm text-muted-foreground">共 {comments.length} 条评论</div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">加载中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">暂无评论</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-foreground text-sm">{comment.nickname}</span>
                    <span className="text-xs text-muted-foreground">
                      {comment.games?.title ? (
                        <a
                          href={`/game/${comment.game_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          {comment.games.title}
                        </a>
                      ) : (
                        '未知游戏'
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/90">{comment.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  disabled={deleting === comment.id}
                  className="shrink-0 px-3 py-1 rounded text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                >
                  {deleting === comment.id ? '删除中...' : '删除'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
