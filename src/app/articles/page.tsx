'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { safeJson } from '@/lib/admin-fetch';

interface Article {
  id: number;
  title: string;
  content: string;
  author_name: string;
  category: string;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  cover_image: string;
  created_at: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then(safeJson)
      .then((data: any) => {
        setArticles(data?.articles || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-color, #0f0f13)' }}>
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color, #0f0f13)' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--accent-color, #7c3aed)' }}>
              ← 返回首页
            </Link>
            <h1 className="text-2xl font-bold text-white mt-2">文章</h1>
          </div>
          <Link
            href="/articles/submit"
            className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--accent-color, #7c3aed)' }}
          >
            发布文章
          </Link>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">暂无文章</p>
            <p className="text-gray-600 text-sm">成为第一个发布文章的人吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map(article => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="block rounded-xl border border-white/8 p-5 transition-all hover:border-purple-500/30 hover:translate-y-[-2px]"
                style={{ backgroundColor: 'var(--card-bg, #1a1a24)' }}
              >
                <div className="flex gap-4">
                  {article.cover_image && (
                    <img
                      src={article.cover_image}
                      alt={article.title}
                      className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {article.is_featured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">精选</span>
                      )}
                      {article.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                          {article.category}
                        </span>
                      )}
                    </div>
                    <h3 className="text-white font-medium text-base mb-1 truncate">{article.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{article.content.substring(0, 100)}...</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>{article.author_name}</span>
                      <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      <span>{article.view_count} 次浏览</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
