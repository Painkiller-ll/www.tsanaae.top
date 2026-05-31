'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserInfo {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string;
  role: string;
  points: number;
}

interface CheckInStatus {
  checked_in_today: boolean;
  consecutive_days: number;
  recent_checks: { check_in_date: string; points_earned: number }[];
}

interface PointTransaction {
  id: string;
  amount: number;
  balance_after: number;
  reason: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{ points_earned: number; consecutive_days: number } | null>(null);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState('');

  const fetchUserData = useCallback(async () => {
    try {
      const [authRes, checkInRes, pointsRes] = await Promise.all([
        fetch('/api/user/auth/check'),
        fetch('/api/user/checkin'),
        fetch('/api/user/points'),
      ]);

      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.push('/login');
        return;
      }
      setUser(authData.user);
      setNickname(authData.user.nickname);

      if (checkInRes.ok) {
        setCheckInStatus(await checkInRes.json());
      }

      if (pointsRes.ok) {
        const pointsData = await pointsRes.json();
        setTransactions(pointsData.transactions || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch('/api/user/checkin', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCheckInResult({ points_earned: data.points_earned, consecutive_days: data.consecutive_days });
        if (user) setUser({ ...user, points: data.total_points });
        // Refresh status
        const statusRes = await fetch('/api/user/checkin');
        if (statusRes.ok) setCheckInStatus(await statusRes.json());
      } else {
        alert(data.error || '签到失败');
      }
    } catch {
      alert('网络错误');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleUpdateNickname = async () => {
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      if (res.ok) {
        if (user) setUser({ ...user, nickname });
        setEditingNickname(false);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await fetch('/api/user/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center">
        <div className="text-[#71717a]">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      {/* Header */}
      <div className="bg-[#1a1a24] border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-8 w-8 items-center justify-center rounded-md bg-[#7c3aed] flex">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
              <span className="text-sm font-semibold gradient-text">Tsanaae Game</span>
            </Link>
            <h1 className="text-lg font-bold text-white">个人中心</h1>
            <div className="w-24" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* User Info Card */}
        <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[#7c3aed]/20 flex items-center justify-center text-2xl font-bold text-[#7c3aed]">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editingNickname ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="px-3 py-1.5 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-[#7c3aed]"
                  />
                  <button onClick={handleUpdateNickname} className="px-3 py-1.5 bg-[#7c3aed] text-white text-sm rounded-lg hover:bg-[#6d28d9]">保存</button>
                  <button onClick={() => { setEditingNickname(false); setNickname(user.nickname); }} className="px-3 py-1.5 bg-white/[0.05] text-[#71717a] text-sm rounded-lg hover:bg-white/[0.1]">取消</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{user.nickname}</h2>
                  <button onClick={() => setEditingNickname(true)} className="text-xs text-[#7c3aed] hover:text-[#a855f7]">修改</button>
                </div>
              )}
              <p className="text-sm text-[#71717a]">{user.email}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-[#a855f7] font-medium">{user.points} 积分</span>
                {user.role === 'admin' && <span className="text-xs bg-[#7c3aed]/20 text-[#7c3aed] px-2 py-0.5 rounded">管理员</span>}
              </div>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-white/[0.05] text-[#71717a] rounded-lg hover:bg-white/[0.1] text-sm">退出登录</button>
          </div>
        </div>

        {/* Check-in Card */}
        <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] p-6">
          <h3 className="text-lg font-bold text-white mb-4">每日签到</h3>
          <div className="flex items-center gap-6">
            <button
              onClick={handleCheckIn}
              disabled={checkingIn || checkInStatus?.checked_in_today}
              className={`px-8 py-4 rounded-xl text-lg font-bold transition-all ${
                checkInStatus?.checked_in_today
                  ? 'bg-white/[0.05] text-[#71717a] cursor-not-allowed'
                  : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white hover:scale-105'
              }`}
            >
              {checkingIn ? '签到中...' : checkInStatus?.checked_in_today ? '今日已签到' : '立即签到'}
            </button>
            <div className="space-y-1">
              <p className="text-sm text-[#e4e4e7]">连续签到 <span className="text-[#a855f7] font-bold">{checkInStatus?.consecutive_days || 0}</span> 天</p>
              <p className="text-xs text-[#71717a]">签到奖励：1-2天10积分 | 3-6天20积分 | 7天+30积分</p>
            </div>
          </div>
          {checkInResult && (
            <div className="mt-4 p-3 bg-[#7c3aed]/10 border border-[#7c3aed]/20 rounded-lg">
              <p className="text-sm text-[#a855f7]">签到成功！获得 {checkInResult.points_earned} 积分（连续{checkInResult.consecutive_days}天）</p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] p-6">
          <h3 className="text-lg font-bold text-white mb-4">快捷入口</h3>
          <div className="flex gap-3">
            <Link href="/favorites" className="px-4 py-2.5 bg-[#7c3aed]/10 text-[#a855f7] rounded-lg hover:bg-[#7c3aed]/20 text-sm font-medium transition-colors">
              我的收藏
            </Link>
            <Link href="/" className="px-4 py-2.5 bg-white/[0.05] text-[#e4e4e7] rounded-lg hover:bg-white/[0.1] text-sm font-medium transition-colors">
              浏览游戏
            </Link>
          </div>
        </div>

        {/* Points History */}
        <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] p-6">
          <h3 className="text-lg font-bold text-white mb-4">积分记录</h3>
          {transactions.length === 0 ? (
            <p className="text-[#71717a] text-sm">暂无积分记录</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-white/[0.05]">
                  <div>
                    <p className="text-sm text-[#e4e4e7]">{t.reason}</p>
                    <p className="text-xs text-[#71717a]">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </p>
                    <p className="text-xs text-[#71717a]">余额: {t.balance_after}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
