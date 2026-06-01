'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MusicPlayer from './MusicPlayer';

interface Game {
  id: string;
  title: string;
  cover_image: string;
  download_count?: number;
  likes?: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function RightSidebar() {
  const [hotGames, setHotGames] = useState<Game[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [showBackTop, setShowBackTop] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetch('/api/games?sort=downloads&limit=5')
      .then(res => res.json())
      .then(data => setHotGames(data.games || []))
      .catch(() => {});

    fetch('/api/faqs')
      .then(res => res.json())
      .then(data => setFaqs((data.faqs || []).slice(0, 4)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isCollapsed) {
    return (
      <>
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
          <button
            onClick={() => setIsCollapsed(false)}
            className="bg-card border border-border rounded-l-lg p-2 hover:bg-purple-600/20 transition-colors"
            title="展开侧边栏"
          >
            <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
        {showBackTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg shadow-purple-900/30 flex items-center justify-center transition-all hover:scale-110"
            title="回到顶部"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <aside className="w-64 shrink-0 hidden xl:block sticky top-20 self-start space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
        {/* 近期热门 */}
        {hotGames.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <span className="text-orange-400">🔥</span> 近期热门
              </h3>
            </div>
            <div className="space-y-2">
              {hotGames.map((game, idx) => (
                <Link
                  key={game.id}
                  href={`/game/${game.id}`}
                  className="flex items-center gap-2.5 group"
                >
                  <span className={`w-5 h-5 rounded text-xs font-bold flex items-center justify-center shrink-0 ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                    idx === 2 ? 'bg-orange-400/20 text-orange-400' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm text-foreground/80 group-hover:text-purple-400 transition-colors truncate">
                    {game.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 音乐播放器 */}
        <MusicPlayer />

        {/* 常见问题 */}
        {faqs.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-3">
              <span>❓</span> 常见问题
            </h3>
            <div className="space-y-2">
              {faqs.map(faq => (
                <div key={faq.id}>
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                    className="w-full text-left text-xs text-foreground/80 hover:text-purple-400 transition-colors flex items-start gap-1"
                  >
                    <span className="text-purple-400 shrink-0 mt-0.5">{expandedFaq === faq.id ? '▾' : '▸'}</span>
                    <span className="line-clamp-2">{faq.question}</span>
                  </button>
                  {expandedFaq === faq.id && (
                    <p className="text-xs text-muted-foreground mt-1 ml-4 leading-relaxed">
                      {faq.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <Link
              href="/faq"
              className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block"
            >
              查看更多 →
            </Link>
          </div>
        )}

        {/* 联系我们入口 */}
        <Link
          href="/contact"
          className="bg-card rounded-xl border border-border p-4 hover:border-purple-500/50 transition-colors block"
        >
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <span>📬</span> 联系我们
          </h3>
          <p className="text-xs text-muted-foreground mt-1">有问题？随时联系站长</p>
        </Link>

        {/* 收起按钮 */}
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
        >
          收起侧边栏 ›
        </button>
      </aside>

      {/* 回到顶部按钮 */}
      {showBackTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg shadow-purple-900/30 flex items-center justify-center transition-all hover:scale-110"
          title="回到顶部"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </>
  );
}
