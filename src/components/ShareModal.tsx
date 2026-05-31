'use client';

import { useState } from 'react';
import { Game } from '@/lib/types';

interface ShareModalProps {
  game: Game;
  onClose: () => void;
}

export default function ShareModal({ game, onClose }: ShareModalProps) {
  const [sharing, setSharing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const gameUrl = typeof window !== 'undefined' ? `${window.location.origin}/game/${game.id}` : '';
  const shareTitle = game.title;
  const shareDesc = `来Tsanaae游戏站一起玩「${game.title}」吧！`;

  const shareOptions = [
    { platform: 'wechat', name: '微信', icon: '💬', color: 'bg-green-600/20 hover:bg-green-600/30' },
    { platform: 'qq', name: 'QQ', icon: '🐧', color: 'bg-blue-600/20 hover:bg-blue-600/30' },
    { platform: 'weibo', name: '微博', icon: '📝', color: 'bg-red-600/20 hover:bg-red-600/30' },
    { platform: 'link', name: '复制链接', icon: '🔗', color: 'bg-purple-600/20 hover:bg-purple-600/30' },
  ];

  const copyToClipboard = async (text: string): Promise<boolean> => {
    // 优先使用 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback
      }
    }
    // Fallback: 使用 textarea 复制
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  };

  const handleShare = async (platform: string) => {
    setSharing(true);
    setResult(null);

    try {
      if (platform === 'link') {
        // 复制链接
        const success = await copyToClipboard(gameUrl);
        if (success) {
          setResult('链接已复制到剪贴板');
        } else {
          setResult('复制失败，请手动复制链接');
        }
      } else if (platform === 'wechat') {
        // 微信分享：由于微信没有开放分享URL scheme，提示用户复制链接后在微信中粘贴
        const shareText = `${shareDesc}\n${gameUrl}`;
        const success = await copyToClipboard(shareText);
        if (success) {
          setResult('分享内容已复制，请打开微信粘贴发送给好友');
        } else {
          setResult('复制失败，请手动复制链接');
        }
      } else if (platform === 'qq') {
        // QQ 分享 URL scheme
        const qqShareUrl = `https://connect.qq.com/widget/shareqq/index.html?title=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(gameUrl)}&summary=${encodeURIComponent(shareDesc)}`;
        window.open(qqShareUrl, '_blank', 'width=600,height=500');
        setResult('已打开QQ分享窗口');
      } else if (platform === 'weibo') {
        // 微博分享 URL scheme
        const weiboShareUrl = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(shareDesc)}&url=${encodeURIComponent(gameUrl)}`;
        window.open(weiboShareUrl, '_blank', 'width=600,height=500');
        setResult('已打开微博分享窗口');
      }

      // 记录分享行为，获取积分
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_token='))
        ?.split('=')[1];

      if (token) {
        try {
          const res = await fetch('/api/user/share', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ game_id: game.id, platform }),
          });
          const data = await res.json();
          if (data.points_earned > 0) {
            setResult(prev => prev ? `${prev} (+${data.points_earned}积分)` : `获得${data.points_earned}积分`);
          }
        } catch {
          // 积分记录失败不影响分享体验
        }
      }
    } catch {
      setResult('分享操作出现问题，请重试');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl border border-border/50 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">分享游戏</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-secondary/30 border border-border/30">
          <p className="text-sm text-foreground font-medium">{game.title}</p>
          <p className="text-xs text-muted-foreground mt-1">分享给好友，每日首次分享可获得3积分</p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {shareOptions.map((opt) => (
            <button
              key={opt.platform}
              onClick={() => handleShare(opt.platform)}
              disabled={sharing}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl ${opt.color} border border-border/30 transition-all hover:scale-105 disabled:opacity-50`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="text-xs text-foreground">{opt.name}</span>
            </button>
          ))}
        </div>

        {result && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center">
            <p className="text-sm text-primary">{result}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-3 w-full py-2 rounded-xl bg-secondary/30 border border-border/30 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
