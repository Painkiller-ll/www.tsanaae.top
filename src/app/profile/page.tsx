'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUserLevel, USER_LEVELS } from '@/lib/types';
import CheckinCalendar from '@/components/CheckinCalendar';

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

interface PointTask {
  id: string;
  name: string;
  points: number;
  max: number;
  completed: number;
  remaining: number;
  icon: string;
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
  const [inviteCode, setInviteCode] = useState('');
  const [inviteCount, setInviteCount] = useState(0);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tasks, setTasks] = useState<PointTask[]>([]);

  const fetchUserData = useCallback(async () => {
    try {
      const [authRes, checkInRes, pointsRes, inviteRes, tasksRes] = await Promise.all([
        fetch('/api/user/auth/check'),
        fetch('/api/user/checkin'),
        fetch('/api/user/points'),
        fetch('/api/user/invite'),
        fetch('/api/user/tasks'),
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

      if (inviteRes.ok) {
        const inviteData = await inviteRes.json();
        setInviteCode(inviteData.invite_code || '');
        setInviteCount(inviteData.invite_count || 0);
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-8 w-8 items-center justify-center rounded-md bg-purple-600 flex">
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
        {/* User Info Card with Level */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-purple-600/20 flex items-center justify-center text-2xl font-bold text-purple-500">
              {user.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              {editingNickname ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="px-3 py-1.5 bg-background border border-border rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                  <button onClick={handleUpdateNickname} className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">保存</button>
                  <button onClick={() => { setEditingNickname(false); setNickname(user.nickname); }} className="px-3 py-1.5 bg-secondary/50 text-muted-foreground text-sm rounded-lg hover:bg-secondary">取消</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">{user.nickname}</h2>
                  <button onClick={() => setEditingNickname(true)} className="text-xs text-purple-500 hover:text-purple-400">修改</button>
                </div>
              )}
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-purple-400 font-medium">{user.points} 积分</span>
                {user.role === 'admin' && <span className="text-xs bg-purple-600/20 text-purple-500 px-2 py-0.5 rounded">管理员</span>}
                <span className={`text-xs px-2 py-0.5 rounded ${getUserLevel(user.points).bgColor} ${getUserLevel(user.points).textColor}`}>
                  Lv.{getUserLevel(user.points).level} {getUserLevel(user.points).name}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-secondary/50 text-muted-foreground rounded-lg hover:bg-secondary text-sm">退出登录</button>
          </div>
          {/* Level Progress Bar */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{getUserLevel(user.points).name}</span>
              <span className="text-xs text-muted-foreground">
                {user.points} / {getUserLevel(user.points).nextLevelPoints} 升级
              </span>
            </div>
            <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (user.points / getUserLevel(user.points).nextLevelPoints) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Level Privileges Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-bold text-white mb-4">等级特权</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {USER_LEVELS.map((lv) => (
              <div
                key={lv.level}
                className={`rounded-lg border p-3 text-center transition-all ${
                  getUserLevel(user.points).level >= lv.level
                    ? 'border-purple-500/30 bg-purple-600/10'
                    : 'border-border bg-secondary/20 opacity-50'
                }`}
              >
                <div className={`text-lg font-bold ${getUserLevel(user.points).level >= lv.level ? 'text-purple-400' : 'text-muted-foreground'}`}>
                  Lv.{lv.level}
                </div>
                <div className={`text-xs ${getUserLevel(user.points).level >= lv.level ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {lv.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{lv.minPoints}分</div>
              </div>
            ))}
          </div>
        </div>

        {/* Check-in Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-bold text-white mb-4">每日签到</h3>
          <div className="flex items-center gap-6">
            <button
              onClick={handleCheckIn}
              disabled={checkingIn || checkInStatus?.checked_in_today}
              className={`px-8 py-4 rounded-xl text-lg font-bold transition-all ${
                checkInStatus?.checked_in_today
                  ? 'bg-secondary/50 text-muted-foreground cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-105'
              }`}
            >
              {checkingIn ? '签到中...' : checkInStatus?.checked_in_today ? '今日已签到' : '立即签到'}
            </button>
            <div className="space-y-1">
              <p className="text-sm text-foreground">连续签到 <span className="text-purple-400 font-bold">{checkInStatus?.consecutive_days || 0}</span> 天</p>
              <p className="text-xs text-muted-foreground">签到奖励：1-2天10积分 | 3-6天20积分 | 7天+30积分</p>
            </div>
          </div>
          {checkInResult && (
            <div className="mt-4 p-3 bg-purple-600/10 border border-purple-500/20 rounded-lg">
              <p className="text-sm text-purple-400">签到成功！获得 {checkInResult.points_earned} 积分（连续{checkInResult.consecutive_days}天）</p>
            </div>
          )}
          <div className="mt-4">
            <CheckinCalendar />
          </div>
        </div>

        {/* Point Tasks Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-bold text-white mb-4">积分任务</h3>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{task.icon}</span>
                  <div>
                    <p className="text-sm text-foreground">{task.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.remaining > 0
                        ? `今日剩余 ${task.remaining}/${task.max} 次`
                        : '今日已完成'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-purple-400">+{task.points}</span>
                  {task.remaining > 0 ? (
                    <Link
                      href="/"
                      className="px-3 py-1 bg-purple-600/10 text-purple-400 text-xs rounded-lg hover:bg-purple-600/20 transition-colors"
                    >
                      去完成
                    </Link>
                  ) : (
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-lg">已完成</span>
                  )}
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-muted-foreground text-sm">暂无积分任务</p>
            )}
          </div>
        </div>

        {/* Invite Card */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-bold text-white mb-4">邀请好友</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-foreground mb-1">我的邀请码</p>
                <div className="flex items-center gap-2">
                  <code className="px-4 py-2 bg-background rounded-lg text-purple-400 font-mono text-lg tracking-wider">
                    {inviteCode || '加载中...'}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(inviteCode);
                      setInviteMsg({ type: 'success', text: '邀请码已复制' });
                      setTimeout(() => setInviteMsg(null), 2000);
                    }}
                    className="px-3 py-2 bg-purple-600/10 text-purple-400 text-sm rounded-lg hover:bg-purple-600/20 transition-colors"
                  >
                    复制
                  </button>
                </div>
              </div>
              <div className="text-center px-6 border-l border-border">
                <p className="text-2xl font-bold text-purple-400">{inviteCount}</p>
                <p className="text-xs text-muted-foreground">已邀请</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                placeholder="输入好友的邀请码"
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 placeholder:text-muted-foreground"
              />
              <button
                onClick={async () => {
                  if (!inviteInput.trim()) return;
                  try {
                    const res = await fetch('/api/user/invite', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ code: inviteInput.trim() }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      setInviteMsg({ type: 'success', text: `兑换成功！获得 ${data.points_awarded || 30} 积分` });
                      setInviteInput('');
                      fetchUserData();
                    } else {
                      setInviteMsg({ type: 'error', text: data.error || '兑换失败' });
                    }
                  } catch {
                    setInviteMsg({ type: 'error', text: '网络错误' });
                  }
                  setTimeout(() => setInviteMsg(null), 3000);
                }}
                className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                兑换
              </button>
            </div>
            {inviteMsg && (
              <p className={`text-sm ${inviteMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {inviteMsg.text}
              </p>
            )}
            <p className="text-xs text-muted-foreground">分享你的邀请码给好友，好友注册后双方各获得 50 积分奖励！</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-bold text-white mb-4">快捷入口</h3>
          <div className="flex gap-3 flex-wrap">
            <Link href="/favorites" className="px-4 py-2.5 bg-purple-600/10 text-purple-400 rounded-lg hover:bg-purple-600/20 text-sm font-medium transition-colors">
              我的收藏
            </Link>
            <Link href="/shop" className="px-4 py-2.5 bg-purple-600/10 text-purple-400 rounded-lg hover:bg-purple-600/20 text-sm font-medium transition-colors">
              积分商城
            </Link>
            <Link href="/leaderboard" className="px-4 py-2.5 bg-purple-600/10 text-purple-400 rounded-lg hover:bg-purple-600/20 text-sm font-medium transition-colors">
              排行榜
            </Link>
            <Link href="/" className="px-4 py-2.5 bg-secondary/50 text-foreground rounded-lg hover:bg-secondary text-sm font-medium transition-colors">
              浏览游戏
            </Link>
          </div>
        </div>

        {/* Points History */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-bold text-white mb-4">积分记录</h3>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无积分记录</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm text-foreground">{t.reason}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${t.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {t.amount > 0 ? '+' : ''}{t.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">余额: {t.balance_after}</p>
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
