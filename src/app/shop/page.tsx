'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserLevel, USER_LEVELS } from '@/lib/types';

interface ShopItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  cost: number;
  image_url?: string;
  stock: number;
  is_active: boolean;
  purchased?: boolean;
  metadata?: Record<string, unknown>;
}

interface UserInfo {
  id: string;
  nickname: string;
  points: number;
  avatar_url: string;
}

export default function ShopPage() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/user/auth/check').then(r => r.json()),
      fetch('/api/user/shop').then(r => r.json()),
    ]).then(([authData, shopData]) => {
      if (authData.user) {
        setUser(authData.user);
      }
      setItems(shopData.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handlePurchase = async (item: ShopItem) => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    setPurchasing(item.id);
    setMessage(null);
    try {
      const res = await fetch('/api/user/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `兑换成功！获得: ${data.item_name}` });
        setUser(prev => prev ? { ...prev, points: data.points_remaining } : null);
        // Refresh items
        const shopRes = await fetch('/api/user/shop');
        const shopData = await shopRes.json();
        setItems(shopData.items || []);
      } else {
        setMessage({ type: 'error', text: data.error || '兑换失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' });
    } finally {
      setPurchasing(null);
    }
  };

  const level = getUserLevel(user?.points || 0);
  const nextLevel = USER_LEVELS.find(l => l.min_points > (user?.points || 0));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">首页</Link>
            <span>/</span>
            <span className="text-foreground">积分商城</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* User Stats Banner */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-2xl">
                {level.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-lg">{user?.nickname || '游客'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${level.color}20`, color: level.color }}>
                    {level.icon} {level.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-yellow-400 font-bold text-xl">{user?.points || 0}</span>
                  <span className="text-sm text-muted-foreground">积分</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {nextLevel && (
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">距离下一等级</p>
                  <p className="text-foreground font-medium">{nextLevel.icon} {nextLevel.name}</p>
                  <p className="text-xs text-muted-foreground">还需 {nextLevel.min_points - (user?.points || 0)} 积分</p>
                </div>
              )}
              <Link
                href="/profile"
                className="rounded-xl px-5 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
              >
                做任务赚积分
              </Link>
            </div>
          </div>
          {/* Progress bar */}
          {nextLevel && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[#a855f7] transition-all duration-500"
                  style={{
                    width: `${Math.min(100, ((user?.points || 0) / nextLevel.min_points) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-400' : 'border-red-500/30 bg-red-500/10 text-red-400'}`}>
            {message.text}
          </div>
        )}

        {/* Shop Items */}
        <h2 className="text-lg font-semibold text-foreground mb-4">积分兑换</h2>
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🏪</div>
            <p className="text-muted-foreground">商城商品筹备中，敬请期待...</p>
            <p className="text-sm text-muted-foreground mt-2">先去签到赚积分吧！</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl border border-border/50 bg-card p-5 hover:border-primary/30 transition-all group">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl shrink-0">
                    {item.type === 'avatar_frame' ? '🖼️' : item.type === 'title' ? '🏅' : item.type === 'unlock' ? '🔑' : '🎁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-yellow-400 font-bold text-sm">{item.cost}</span>
                      <span className="text-xs text-muted-foreground">积分</span>
                      {item.stock !== Infinity && item.stock > 0 && (
                        <span className="text-xs text-muted-foreground">剩余 {item.stock}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(item)}
                  disabled={purchasing === item.id || item.purchased || (user ? user.points < item.cost : true)}
                  className={`w-full mt-4 rounded-lg py-2 text-sm font-medium transition-colors ${
                    item.purchased
                      ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                      : user && user.points >= item.cost
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-secondary text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  {purchasing === item.id ? '兑换中...' : item.purchased ? '已拥有' : user && user.points < item.cost ? '积分不足' : '立即兑换'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Level Info */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-foreground mb-4">等级体系</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {USER_LEVELS.map((lvl) => (
              <div key={lvl.level} className={`rounded-xl border p-4 text-center transition-all ${
                level.level === lvl.level ? 'border-primary/50 bg-primary/10' : 'border-border/50 bg-card'
              }`}>
                <div className="text-2xl mb-1">{lvl.icon}</div>
                <div className="text-sm font-semibold" style={{ color: lvl.color }}>{lvl.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{lvl.min_points}+ 积分</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
