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
  const [isCollapsed, setIsCollapsed] = useState(true); // 默认收起

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

  // 收起状态：右侧一列小图标按钮
  if (isCollapsed) {
    return (
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {/* 展开侧边栏 */}
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-10 h-10 bg-card border border-border rounded-lg shadow-md hover:bg-purple-600/20 hover:border-purple-500/50 transition-all flex items-center justify-center group"
          title="展开侧边栏"
        >
          <svg className="w-4 h-4 text-muted-foreground group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {/* 音乐 */}
        <Link
          href="/shop"
          className="w-10 h-10 bg-card border border-border rounded-lg shadow-md hover:bg-purple-600/20 hover:border-purple-500/50 transition-all flex items-center justify-center group"
          title="积分商城"
        >
          <svg className="w-4 h-4 text-muted-foreground group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Link>
        {/* FAQ */}
        <Link
          href="/faq"
          className="w-10 h-10 bg-card border border-border rounded-lg shadow-md hover:bg-purple-600/20 hover:border-purple-500/50 transition-all flex items-center justify-center group"
          title="常见问题"
        >
          <svg className="w-4 h-4 text-muted-foreground group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </Link>
        {/* 联系我们 */}
        <Link
          href="/contact"
          className="w-10 h-10 bg-card border border-border rounded-lg shadow-md hover:bg-purple-600/20 hover:border-purple-500/50 transition-all flex items-center justify-center group"
          title="联系我们"
        >
          <svg className="w-4 h-4 text-muted-foreground group-hover:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </Link>
        {/* 回到顶部 */}
        {showBackTop && (
          <button
            onClick={scrollToTop}
            className="w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-md shadow-purple-900/30 transition-all hover:scale-110 flex items-center justify-center"
            title="回到顶部"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // 展开状态：右侧浮动面板
  return (
    <>
      {/* 遮罩层（移动端） */}
      <div
        className="fixed inset-0 bg-black/30 z-40 lg:hidden"
        onClick={() => setIsCollapsed(true)}
      />

      {/* 侧边面板 */}
      <aside className="fixed right-3 top-20 z-50 w-64 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl bg-card/95 backdrop-blur-sm border border-border shadow-xl space-y-3 p-3">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">快捷面板</span>
          <button
            onClick={() => setIsCollapsed(true)}
            className="w-6 h-6 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 近期热门 */}
        {hotGames.length > 0 && (
          <div className="bg-secondary/50 rounded-lg p-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
              <span className="text-orange-400">🔥</span> 近期热门
            </h3>
            <div className="space-y-1.5">
              {hotGames.map((game, idx) => (
                <Link
                  key={game.id}
                  href={`/game/${game.id}`}
                  className="flex items-center gap-2 group"
                  onClick={() => setIsCollapsed(true)}
                >
                  <span className={`w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    idx === 1 ? 'bg-gray-400/20 text-gray-400' :
                    idx === 2 ? 'bg-orange-400/20 text-orange-400' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-xs text-foreground/80 group-hover:text-purple-400 transition-colors truncate">
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
          <div className="bg-secondary/50 rounded-lg p-3">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 mb-2">
              <span>❓</span> 常见问题
            </h3>
            <div className="space-y-1.5">
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
              onClick={() => setIsCollapsed(true)}
            >
              查看更多 →
            </Link>
          </div>
        )}

        {/* 联系我们入口 */}
        <Link
          href="/contact"
          className="bg-secondary/50 rounded-lg p-3 hover:bg-purple-600/10 transition-colors block"
          onClick={() => setIsCollapsed(true)}
        >
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <span>📬</span> 联系我们
          </h3>
          <p className="text-[10px] text-muted-foreground mt-1">有问题？随时联系站长</p>
        </Link>

        {/* 底部：回到顶部 */}
        {showBackTop && (
          <button
            onClick={scrollToTop}
            className="w-full py-1.5 text-xs text-purple-400 hover:text-purple-300 bg-purple-600/10 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            回到顶部
          </button>
        )}
      </aside>
    </>
  );
}
