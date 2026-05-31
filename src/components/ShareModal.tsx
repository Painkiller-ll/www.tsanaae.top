'use client';

import { useState, useEffect } from 'react';
import { Game } from '@/lib/types';

interface ShareModalProps {
  game: Game;
  onClose: () => void;
}

export default function ShareModal({ game, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [pointsMsg, setPointsMsg] = useState<string | null>(null);

  const gameUrl = typeof window !== 'undefined' ? `${window.location.origin}/game/${game.id}` : '';
  const [shareTemplate, setShareTemplate] = useState('来Tsanaae游戏站一起玩「{game_title}」吧！');

  // 从站点设置获取分享文案模板
  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(data => {
        if (data.settings?.share_text_template) {
          setShareTemplate(data.settings.share_text_template);
        }
      })
      .catch(() => {});
  }, []);

  const shareDesc = shareTemplate
    .replace(/\{site_name\}/g, 'Tsanaae Game')
    .replace(/\{game_title\}/g, game.title);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // fallback
      }
    }
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

  const recordShare = async (platform: string) => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_token='))
      ?.split('=')[1];

    if (!token) return;

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
        setPointsMsg(`分享成功，获得 +${data.points_earned} 积分!`);
      } else if (data.message) {
        setPointsMsg(data.message);
      }
    } catch {
      // 积分记录失败不影响分享
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(gameUrl);
    if (success) {
      setCopied('link');
      await recordShare('link');
      setTimeout(() => setCopied(null), 3000);
    }
  };

  const handleCopyShareText = async () => {
    const text = `${shareDesc}\n${gameUrl}`;
    const success = await copyToClipboard(text);
    if (success) {
      setCopied('text');
      await recordShare('wechat');
      setTimeout(() => setCopied(null), 3000);
    }
  };

  const handleQQShare = async () => {
    const qqShareUrl = `https://connect.qq.com/widget/shareqq/index.html?title=${encodeURIComponent(game.title)}&url=${encodeURIComponent(gameUrl)}&summary=${encodeURIComponent(shareDesc)}`;
    window.open(qqShareUrl, '_blank', 'width=600,height=500');
    await recordShare('qq');
  };

  const handleWeiboShare = async () => {
    const weiboShareUrl = `https://service.weibo.com/share/share.php?title=${encodeURIComponent(shareDesc)}&url=${encodeURIComponent(gameUrl)}`;
    window.open(weiboShareUrl, '_blank', 'width=600,height=500');
    await recordShare('weibo');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md mx-4 rounded-2xl border border-border/50 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-foreground">分享游戏</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* 游戏信息卡片 */}
        <div className="mb-5 p-3 rounded-xl bg-secondary/30 border border-border/30 flex items-center gap-3">
          {game.cover_image && (
            <img src={game.cover_image} alt={game.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm text-foreground font-medium truncate">{game.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">分享给好友，每日首次分享可获得3积分</p>
          </div>
        </div>

        {/* 分享链接预览 */}
        <div className="mb-4 p-3 rounded-xl bg-[#0f0f13] border border-border/30">
          <p className="text-xs text-muted-foreground mb-1">分享链接</p>
          <p className="text-sm text-foreground/80 truncate font-mono">{gameUrl}</p>
        </div>

        {/* 分享方式 */}
        <div className="space-y-2 mb-4">
          {/* 复制链接 - 最常用，放第一个 */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/20 transition-all"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600/30 text-lg">🔗</span>
            <div className="flex-1 text-left">
              <p className="text-sm text-foreground font-medium">复制链接</p>
              <p className="text-xs text-muted-foreground">直接复制游戏页面链接</p>
            </div>
            {copied === 'link' && (
              <span className="text-xs text-green-400 font-medium">已复制!</span>
            )}
          </button>

          {/* 复制分享文案 */}
          <button
            onClick={handleCopyShareText}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-600/15 hover:bg-green-600/25 border border-green-500/20 transition-all"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600/30 text-lg">💬</span>
            <div className="flex-1 text-left">
              <p className="text-sm text-foreground font-medium">复制分享文案</p>
              <p className="text-xs text-muted-foreground">复制含推荐语的文字，粘贴到微信/QQ群</p>
            </div>
            {copied === 'text' && (
              <span className="text-xs text-green-400 font-medium">已复制!</span>
            )}
          </button>

          {/* QQ 分享 */}
          <button
            onClick={handleQQShare}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/20 transition-all"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/30 text-lg">🐧</span>
            <div className="flex-1 text-left">
              <p className="text-sm text-foreground font-medium">分享到QQ</p>
              <p className="text-xs text-muted-foreground">打开QQ分享窗口</p>
            </div>
          </button>

          {/* 微博分享 */}
          <button
            onClick={handleWeiboShare}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/20 transition-all"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600/30 text-lg">📝</span>
            <div className="flex-1 text-left">
              <p className="text-sm text-foreground font-medium">分享到微博</p>
              <p className="text-xs text-muted-foreground">打开微博分享窗口</p>
            </div>
          </button>
        </div>

        {/* 积分提示 */}
        {pointsMsg && (
          <div className="mb-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <p className="text-sm text-yellow-400">{pointsMsg}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-secondary/30 border border-border/30 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  );
}
