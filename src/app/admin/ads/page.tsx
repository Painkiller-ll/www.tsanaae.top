'use client';

import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/admin-fetch';

interface Ad {
  id?: number;
  title: string;
  content: string;
  link_url: string;
  link_text: string;
  bg_color: string;
  sort_order: number;
  is_active: boolean;
}

const defaultAd: Ad = {
  title: '',
  content: '',
  link_url: '',
  link_text: '',
  bg_color: '#7c3aed',
  sort_order: 0,
  is_active: true,
};

export default function AdsAdminPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadAds = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/ads');
      const data = await res.json();
      setAds(data.data || []);
    } catch (e) {
      console.error('加载广告失败', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAds(); }, []);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (isNew) {
        await adminFetch('/api/admin/ads', {
          method: 'POST',
          body: JSON.stringify(editing),
        });
      } else {
        await adminFetch(`//api/admin/ads/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(editing),
        });
      }
      setEditing(null);
      setIsNew(false);
      loadAds();
    } catch (e) {
      console.error('保存失败', e);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此广告？')) return;
    try {
      await adminFetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
      loadAds();
    } catch (e) {
      console.error('删除失败', e);
    }
  };

  const handleToggle = async (ad: Ad) => {
    if (!ad.id) return;
    try {
      await adminFetch(`/api/admin/ads/${ad.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !ad.is_active }),
      });
      loadAds();
    } catch (e) {
      console.error('切换失败', e);
    }
  };

  const colorOptions = [
    { label: '紫色(默认)', value: '#7c3aed' },
    { label: '蓝色', value: '#3b82f6' },
    { label: '绿色', value: '#10b981' },
    { label: '红色', value: '#ef4444' },
    { label: '橙色', value: '#f59e0b' },
    { label: '粉色', value: '#ec4899' },
    { label: '深灰', value: '#374151' },
    { label: '金色', value: '#b8860b' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-zinc-400">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">首页广告管理</h1>
          <p className="text-sm text-zinc-400 mt-1">管理首页公告/广告区域的内容，支持文字和链接跳转</p>
        </div>
        <button
          onClick={() => { setEditing({ ...defaultAd }); setIsNew(true); }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
        >
          + 新增广告
        </button>
      </div>

      {/* 编辑区 */}
      {editing && (
        <div className="bg-zinc-900 border border-purple-500/30 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">{isNew ? '新增广告' : '编辑广告'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">标题 *</label>
              <input
                value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="如：限时活动 / 站长推荐"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">背景色</label>
              <select
                value={editing.bg_color}
                onChange={e => setEditing({ ...editing, bg_color: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                {colorOptions.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">内容文字 *</label>
            <textarea
              value={editing.content}
              onChange={e => setEditing({ ...editing, content: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:outline-none min-h-[80px]"
              placeholder="广告/公告的正文内容，如：新用户注册送100积分！"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">链接地址</label>
              <input
                value={editing.link_url}
                onChange={e => setEditing({ ...editing, link_url: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="https://... 点击后跳转的地址"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">链接文字</label>
              <input
                value={editing.link_text}
                onChange={e => setEditing({ ...editing, link_text: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                placeholder="如：立即查看 / 点击了解"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">排序(小的在前)</label>
              <input
                type="number"
                value={editing.sort_order}
                onChange={e => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                className="w-24 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <label className="flex items-center gap-2 mt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.is_active}
                onChange={e => setEditing({ ...editing, is_active: e.target.checked })}
                className="w-4 h-4 accent-purple-500"
              />
              <span className="text-sm text-zinc-300">启用</span>
            </label>
          </div>

          {/* 预览 */}
          {editing.content && (
            <div className="border border-zinc-700 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-2">预览效果：</p>
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: editing.bg_color + '22', borderLeft: `4px solid ${editing.bg_color}` }}
              >
                {editing.title && <p className="font-bold text-white text-sm mb-1">{editing.title}</p>}
                <p className="text-zinc-300 text-sm">{editing.content}</p>
                {editing.link_text && editing.link_url && (
                  <span className="inline-block mt-2 text-sm font-medium" style={{ color: editing.bg_color }}>
                    {editing.link_text} →
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !editing.title || !editing.content}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => { setEditing(null); setIsNew(false); }}
              className="px-6 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 广告列表 */}
      {ads.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg">暂无广告</p>
          <p className="text-sm mt-1">点击上方"新增广告"按钮添加</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <div
              key={ad.id}
              className={`bg-zinc-900 border rounded-xl p-4 ${ad.is_active ? 'border-zinc-700' : 'border-zinc-800 opacity-60'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: ad.bg_color }}
                    />
                    <span className="font-bold text-white">{ad.title || '(无标题)'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${ad.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                      {ad.is_active ? '启用' : '禁用'}
                    </span>
                    <span className="text-xs text-zinc-500">排序: {ad.sort_order}</span>
                  </div>
                  <p className="text-sm text-zinc-400 truncate">{ad.content}</p>
                  {ad.link_url && (
                    <p className="text-xs text-purple-400 mt-1 truncate">
                      链接: {ad.link_url}
                      {ad.link_text && <span className="text-zinc-500 ml-1">({ad.link_text})</span>}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(ad)}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${ad.is_active ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                  >
                    {ad.is_active ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => { setEditing({ ...ad }); setIsNew(false); }}
                    className="px-3 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => ad.id && handleDelete(ad.id)}
                    className="px-3 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
