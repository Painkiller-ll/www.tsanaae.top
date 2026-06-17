'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin-fetch';

interface DashboardStats {
  totalResources: number;
  totalCategories: number;
  totalComments: number;
  totalUsers: number;
  resourcesByType: Record<string, number>;
  recentResources: Array<{ id: number; title: string; resource_type: string; created_at: string }>;
}

const TYPE_LABELS: Record<string, string> = {
  study: '学习资料', movie: '影视剧', music: '音乐',
  game: '游戏', novel: '小说', software: '实用软件',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/stats').then(r => r.json()).then(data => {
      setStats(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">仪表盘</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="总资源数" value={stats?.totalResources ?? 0} icon="📦" color="bg-violet-50 text-violet-700" />
        <StatCard label="分类数" value={stats?.totalCategories ?? 0} icon="📂" color="bg-blue-50 text-blue-700" />
        <StatCard label="评论数" value={stats?.totalComments ?? 0} icon="💬" color="bg-green-50 text-green-700" />
        <StatCard label="用户数" value={stats?.totalUsers ?? 0} icon="👤" color="bg-orange-50 text-orange-700" />
      </div>

      {/* 各类型资源数 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">各类型资源统计</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <div key={type} className="text-center p-3 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold text-gray-800">{stats?.resourcesByType?.[type] ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">快捷操作</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/resources/new" className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm">
            + 新增资源
          </Link>
          <Link href="/admin/resource-categories" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            管理分类
          </Link>
          <Link href="/admin/announcements" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
            发公告
          </Link>
          <Link href="/admin/settings" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
            站点设置
          </Link>
        </div>
      </div>

      {/* 最近添加的资源 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-800 mb-4">最近添加的资源</h2>
        {stats?.recentResources?.length ? (
          <div className="space-y-2">
            {stats.recentResources.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {TYPE_LABELS[r.resource_type] || r.resource_type}
                  </span>
                  <Link href={`/admin/resources/${r.id}/edit`} className="text-sm text-gray-700 hover:text-violet-600">
                    {r.title}
                  </Link>
                </div>
                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">暂无资源，<Link href="/admin/resources/new" className="text-violet-600 hover:underline">去添加</Link></p>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${color} text-lg mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}
