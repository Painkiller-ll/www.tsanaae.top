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

  const shareOptions = [
    { platform: 'wechat', name: '微信', icon: '💬', color: 'bg-green-600/20 hover:bg-green-600/30' },
    { platform: 'qq', name: 'QQ', icon: '🐧', color: 'bg-blue-600/20 hover:bg-blue-600/30' },
    { platform: 'weibo', name: '微博', icon: '📝', color: 'bg-red-600/20 hover:bg-red-600/30' },
    { platform: 'link', name: '复制链接', icon: '🔗', color: 'bg-purple-600/20 hover:bg-purple-600/30' },
  ];

  const handleShare = async (platform: string) => {
    setSharing(true);
    setResult(null);

    try {
      const gameUrl = `${window.location.origin}/game/${game.id}`;

      if (platform === 'link') {
        await navigator.clipboard.writeText(gameUrl);
        setResult('链接已复制到剪贴板');
      } else {
        // 模拟分享（实际项目中需要集成第三方SDK）
        const shareText = `推荐游戏：${game.title} - ${gameUrl}`;
        if (navigator.share) {
          await navigator.share({ title: game.title, text: shareText, url: gameUrl });
          setResult('分享成功');
        } else {
          await navigator.clipboard.writeText(shareText);
          setResult('分享内容已复制，请粘贴到对应平台');
        }
      }

      // 记录分享行为，获取积分
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_token='))
        ?.split('=')[1];

      if (token) {
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
      }
    } catch {
      setResult('分享操作取消');
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
      </div>
    </div>
  );
}
