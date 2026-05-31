'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserLevel } from '@/lib/types';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  nickname: string;
  avatar_url: string;
  points: number;
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        setLeaders(data.leaderboard || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <div className="border-b border-border/50 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">首页</Link>
            <span>/</span>
            <span className="text-foreground">积分排行榜</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8 flex items-center gap-3">
          <span className="text-3xl">🏆</span> 积分排行榜
        </h1>

        {/* Top 3 Podium */}
        {leaders.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-400/20 text-xl font-bold text-gray-300 mb-2">
                {leaders[1].nickname.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{leaders[1].nickname}</span>
              <span className="text-xs text-yellow-400 font-bold">{leaders[1].points}</span>
              <div className="w-20 h-20 bg-gray-400/10 rounded-t-lg mt-2 flex items-center justify-center text-2xl font-bold text-gray-400">
                2
              </div>
            </div>
            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="text-3xl mb-1">👑</div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/20 text-2xl font-bold text-yellow-400 mb-2">
                {leaders[0].nickname.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-foreground">{leaders[0].nickname}</span>
              <span className="text-sm text-yellow-400 font-bold">{leaders[0].points}</span>
              <div className="w-20 h-28 bg-yellow-400/10 rounded-t-lg mt-2 flex items-center justify-center text-2xl font-bold text-yellow-400">
                1
              </div>
            </div>
            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-700/20 text-xl font-bold text-amber-600 mb-2">
                {leaders[2].nickname.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-foreground">{leaders[2].nickname}</span>
              <span className="text-xs text-yellow-400 font-bold">{leaders[2].points}</span>
              <div className="w-20 h-14 bg-amber-700/10 rounded-t-lg mt-2 flex items-center justify-center text-2xl font-bold text-amber-600">
                3
              </div>
            </div>
          </div>
        )}

        {/* Full List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无排行数据</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.slice(3).map((entry) => {
              const lvl = getUserLevel(entry.points);
              return (
                <div key={entry.user_id} className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors">
                  <div className="w-8 text-center text-sm font-bold text-muted-foreground">
                    {entry.rank}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {entry.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{entry.nickname}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${lvl.color}20`, color: lvl.color }}>
                        {lvl.icon} {lvl.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-yellow-400 font-bold">{entry.points}</span>
                    <span className="text-xs text-muted-foreground ml-1">积分</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
