'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { safeJson } from '@/lib/admin-fetch';

interface Comment {
  id: number;
  content: string;
  author_name: string;
  created_at: string;
}

interface Article {
  id: number;
  title: string;
  content: string;
  author_name: string;
  author_contact: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  cover_image: string;
  created_at: string;
}

export default function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentResult, setCommentResult] = useState<{ success: boolean; message: string } | null>(null);
  const [articleId, setArticleId] = useState<string>('');

  useEffect(() => {
    params.then(p => setArticleId(p.id));
  }, [params]);

  useEffect(() => {
    if (!articleId) return;
    fetch(`/api/articles/${articleId}`)
      .then(safeJson)
      .then((data: any) => {
        setArticle(data?.article || null);
        setComments(data?.comments || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    setCommentResult(null);

    try {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: commentText.trim(),
          author_name: commentName.trim() || '匿名用户',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCommentResult({ success: true, message: '评论已提交，等待审核后展示' });
        setCommentText('');
        setCommentName('');
      } else {
        setCommentResult({ success: false, message: data.error || '评论失败' });
      }
    } catch {
      setCommentResult({ success: false, message: '网络错误' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color, #0f0f13)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color, #0f0f13)' }}>
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-4">文章不存在或未通过审核</p>
          <Link href="/articles" className="text-purple-400 hover:underline">返回文章列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color, #0f0f13)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/articles" className="text-sm hover:underline" style={{ color: 'var(--accent-color, #7c3aed)' }}>
          ← 返回文章列表
        </Link>

        {/* 文章内容 */}
        <article className="mt-6">
          {article.cover_image && (
            <img src={article.cover_image} alt={article.title} className="w-full max-h-64 object-cover rounded-xl mb-6" />
          )}
          <div className="flex items-center gap-2 mb-3">
            {article.is_featured && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">精选</span>
            )}
            {article.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">{article.category}</span>
            )}
            {article.tags?.map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{tag}</span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">{article.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-6">
            <span>{article.author_name}</span>
            <span>{new Date(article.created_at).toLocaleDateString()}</span>
            <span>{article.view_count} 次浏览</span>
          </div>
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-base">
            {article.content}
          </div>
        </article>

        {/* 评论区 */}
        <div className="mt-12 border-t border-white/8 pt-8">
          <h2 className="text-lg font-bold text-white mb-4">评论 ({comments.length})</h2>

          {comments.length > 0 ? (
            <div className="space-y-3 mb-8">
              {comments.map(comment => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-white/5 p-4"
                  style={{ backgroundColor: 'var(--card-bg, #1a1a24)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-purple-400">{comment.author_name}</span>
                    <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-8">暂无评论，来发表第一条评论吧</p>
          )}

          {/* 发表评论 */}
          <form onSubmit={handleComment} className="space-y-3">
            <input
              type="text"
              value={commentName}
              onChange={e => setCommentName(e.target.value)}
              placeholder="昵称（不填则匿名）"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="写下你的评论..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-y"
              required
            />
            {commentResult && (
              <p className={`text-sm ${commentResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {commentResult.message}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 rounded-lg text-white text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--accent-color, #7c3aed)' }}
            >
              {submitting ? '提交中...' : '发表评论'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
