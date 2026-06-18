'use client';

import { useState, useEffect } from 'react';
import MusicPlayer from './MusicPlayer';

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

interface HotResource {
  id: number;
  title: string;
  view_count: number;
  resource_type: string;
}

export default function RightSidebar() {
  const [expanded, setExpanded] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [hotResources, setHotResources] = useState<HotResource[]>([]);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    fetch('/api/faqs?limit=3').then(r => r.json()).then(d => { if (d.data) setFaqs(d.data); }).catch(() => {});
    fetch('/api/resources?sort=hot&limit=5&is_published=true').then(r => r.json()).then(d => { if (d.data) setHotResources(d.data); }).catch(() => {});

    const onScroll = () => setShowBackTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // 移动端：只显示悬浮按钮组（音乐+回顶部），不显示侧边栏
  return (
    <>
      {/* 桌面端侧边栏 */}
      <div className="hidden xl:block fixed right-0 top-16 bottom-0 z-40">
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="group absolute left-0 top-4 -translate-x-full h-14 px-2 bg-gradient-to-r from-yellow-500/20 to-yellow-400/10 border border-yellow-500/30 rounded-l-lg flex items-center justify-center gap-1 hover:from-yellow-500/30 hover:to-yellow-400/20 hover:border-yellow-400/50 transition-all shadow-lg shadow-yellow-500/10"
          >
            <svg className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            <span className="text-[10px] font-bold text-yellow-400/80 group-hover:text-yellow-300 writing-vertical tracking-widest" style={{ writingMode: 'vertical-rl' }}>音乐</span>
          </button>
        ) : (
          <div className="w-72 h-full border-l border-border bg-card/80 backdrop-blur-md overflow-y-auto">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">快捷面板</span>
              <button onClick={() => setExpanded(false)} className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 hover:border-yellow-400/40 transition-colors group">
                <svg className="w-4 h-4 text-yellow-400 group-hover:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* 音乐播放器 */}
            <div className="p-3 border-b border-border">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">🎵 音乐</h3>
              <MusicPlayer />
            </div>

            {/* 热门浏览 */}
            {hotResources.length > 0 && (
              <div className="p-3 border-b border-border">
                <h3 className="text-xs font-medium text-muted-foreground mb-2">🔥 热门浏览</h3>
                <div className="space-y-1.5">
                  {hotResources.map((r, i) => (
                    <a key={r.id} href={`/resource/${r.id}`} className="flex items-center gap-2 text-xs hover:text-primary transition-colors">
                      <span className={`w-4 h-4 rounded text-[10px] flex items-center justify-center shrink-0 ${
                        i < 3 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>{i + 1}</span>
                      <span className="truncate text-foreground">{r.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ */}
            {faqs.length > 0 && (
              <div className="p-3 border-b border-border">
                <h3 className="text-xs font-medium text-muted-foreground mb-2">❓ 常见问题</h3>
                <div className="space-y-1.5">
                  {faqs.map(f => (
                    <details key={f.id} className="text-xs group">
                      <summary className="cursor-pointer text-foreground hover:text-primary transition-colors list-none flex items-center gap-1">
                        <svg className="w-3 h-3 shrink-0 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        {f.question}
                      </summary>
                      <p className="mt-1 pl-4 text-muted-foreground leading-relaxed">{f.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* 回到顶部 */}
            {showBackTop && (
              <div className="p-3">
                <button onClick={scrollToTop} className="w-full py-2 rounded-lg text-xs bg-accent hover:bg-accent/80 transition-colors text-foreground flex items-center justify-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  回到顶部
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 移动端悬浮按钮组 */}
      <div className="xl:hidden fixed right-3 bottom-20 z-50 flex flex-col gap-2">
        <button
          onClick={scrollToTop}
          className={`w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center transition-all hover:bg-accent ${
            showBackTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
        </button>
      </div>
    </>
  );
}
