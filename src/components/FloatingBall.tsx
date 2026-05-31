'use client';

import { useState } from 'react';

interface FloatingBallProps {
  onOpenQrCode?: () => void;
}

export default function FloatingBall({ onOpenQrCode }: FloatingBallProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleClick = () => {
    setIsBouncing(true);
    setIsExpanded(!isExpanded);
    setTimeout(() => setIsBouncing(false), 300);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center gap-3">
      {/* 展开的菜单 */}
      {isExpanded && (
        <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
          {/* 回到顶部 */}
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setIsExpanded(false);
            }}
            className="group flex items-center gap-2"
            title="回到顶部"
          >
            <span className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              回到顶部
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border hover:border-purple-500 transition-colors cursor-pointer shadow-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </div>
          </button>

          {/* 每日签到 */}
          <Link
            href="/profile"
            onClick={() => setIsExpanded(false)}
            className="group flex items-center gap-2"
            title="每日签到"
          >
            <span className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              每日签到
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border hover:border-purple-500 transition-colors cursor-pointer shadow-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </Link>

          {/* 微信二维码 */}
          {onOpenQrCode && (
            <button
              onClick={() => {
                onOpenQrCode();
                setIsExpanded(false);
              }}
              className="group flex items-center gap-2"
              title="微信联系"
            >
              <span className="rounded-lg bg-card border border-border px-3 py-1.5 text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                微信联系
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card border border-border hover:border-green-500 transition-colors cursor-pointer shadow-lg">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#07c160">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.42 6.42 0 0 1-.246-1.79c0-3.558 3.39-6.451 7.585-6.451.258 0 .507.022.76.042C16.706 4.882 13.075 2.188 8.691 2.188zm-2.87 4.401c.63 0 1.14.51 1.14 1.14s-.51 1.14-1.14 1.14-1.14-.51-1.14-1.14.51-1.14 1.14-1.14zm5.577 0c.63 0 1.14.51 1.14 1.14s-.51 1.14-1.14 1.14-1.14-.51-1.14-1.14.51-1.14 1.14-1.14zm3.398 3.24c-3.596 0-6.513 2.478-6.513 5.53s2.917 5.53 6.513 5.53c.708 0 1.39-.103 2.032-.29a.649.649 0 0 1 .544.075l1.445.846a.247.247 0 0 0 .126.041.223.223 0 0 0 .22-.224c0-.055-.022-.108-.036-.162l-.296-1.123a.447.447 0 0 1 .161-.504C20.68 17.826 21.637 16.17 21.637 14.359c0-3.052-2.917-5.53-6.513-5.53h.072zm-2.243 3.39c.48 0 .869.389.869.869s-.389.869-.869.869-.869-.389-.869-.869.389-.869.869-.869zm4.487 0c.48 0 .869.389.869.869s-.389.869-.869.869-.869-.389-.869-.869.389-.869.869-.869z" />
                </svg>
              </div>
            </button>
          )}
        </div>
      )}

      {/* 主悬浮球 - 二次元风格 */}
      <button
        onClick={handleClick}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 cursor-pointer ${
          isBouncing ? 'scale-90' : 'hover:scale-110'
        }`}
        style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #c084fc 100%)',
          boxShadow: isExpanded
            ? '0 0 20px rgba(124,58,237,0.5), 0 0 40px rgba(168,85,247,0.3)'
            : '0 4px 15px rgba(124,58,237,0.4)',
        }}
        title="快捷菜单"
      >
        {/* 猫耳装饰 */}
        <div className="absolute -top-2 left-1 w-3 h-4 bg-gradient-to-b from-[#a855f7] to-[#7c3aed] rounded-t-full transform -rotate-12" />
        <div className="absolute -top-2 right-1 w-3 h-4 bg-gradient-to-b from-[#a855f7] to-[#7c3aed] rounded-t-full transform rotate-12" />
        
        {/* 猫脸 */}
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          {/* 脸部 */}
          <ellipse cx="20" cy="22" rx="12" ry="11" fill="white" fillOpacity="0.95" />
          {/* 左眼 */}
          <ellipse cx="15" cy="20" rx="2.5" ry="3" fill="#7c3aed">
            <animate attributeName="ry" values="3;0.5;3" dur="3s" repeatCount="indefinite" begin="2s" />
          </ellipse>
          {/* 右眼 */}
          <ellipse cx="25" cy="20" rx="2.5" ry="3" fill="#7c3aed">
            <animate attributeName="ry" values="3;0.5;3" dur="3s" repeatCount="indefinite" begin="2s" />
          </ellipse>
          {/* 嘴巴 */}
          <path d="M17 26 Q20 29 23 26" stroke="#7c3aed" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* 腮红 */}
          <circle cx="11" cy="24" r="2.5" fill="#f472b6" fillOpacity="0.4" />
          <circle cx="29" cy="24" r="2.5" fill="#f472b6" fillOpacity="0.4" />
        </svg>

        {/* 旋转光圈动画 */}
        {!isExpanded && (
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-spin" style={{ animationDuration: '8s' }}>
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white/60" />
          </div>
        )}
      </button>
    </div>
  );
}

import Link from 'next/link';
