'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { type ResourceCategory } from '@/lib/types';

export default function SubmitResourcePage() {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    download_url: '',
    resource_type: '',
    category_id: '',
    author: '',
    tags: '',
    cover_url: '',
    submitter_name: '',
    submitter_contact: '',
  });

  useEffect(() => {
    fetch('/api/resource-categories?top_level=true')
      .then(r => r.json())
      .then(d => {
        const cats = d.data || d || [];
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.resource_type) {
      setSubCategories([]);
      setForm(f => ({ ...f, category_id: '' }));
      return;
    }
    fetch(`/api/resource-categories?parent_type=${form.resource_type}`)
      .then(r => r.json())
      .then(d => {
        setSubCategories(d.data || d || []);
      })
      .catch(() => {
        setSubCategories([]);
      });
  }, [form.resource_type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/submit-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          category_id: form.category_id ? parseInt(form.category_id) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || '投稿失败');
        return;
      }
      setSuccess(true);
    } catch {
      setErrorMsg('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f13' }}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-3">投稿成功</h1>
          <p className="text-gray-400 mb-6">你的资源已提交，管理员审核通过后将会在网站上展示</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              返回首页
            </Link>
            <button
              onClick={() => {
                setSuccess(false);
                setForm({ title: '', description: '', download_url: '', resource_type: '', category_id: '', author: '', tags: '', cover_url: '', submitter_name: '', submitter_contact: '' });
              }}
              className="px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-purple-600 to-violet-500 hover:opacity-90 transition-opacity"
            >
              继续投稿
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f0f13' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="text-sm hover:underline mb-4 inline-block" style={{ color: '#7c3aed' }}>
          ← 返回首页
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">资源投稿</h1>
          <p className="text-gray-500 text-sm mt-1">分享你发现的优质资源，审核通过后将在网站展示</p>
        </div>

        {errorMsg && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 资源名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              资源名称 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="例如：原神 5.0 完整客户端"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
              required
            />
          </div>

          {/* 资源类型 + 子分类 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                资源类型 <span className="text-red-400">*</span>
              </label>
              <select
                value={form.resource_type}
                onChange={e => setForm(f => ({ ...f, resource_type: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors appearance-none"
                required
              >
                <option value="" className="bg-[#1a1a24]">选择类型</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug} className="bg-[#1a1a24]">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">子分类</label>
              <select
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors appearance-none"
                disabled={!subCategories.length}
              >
                <option value="" className="bg-[#1a1a24]">选择子分类</option>
                {subCategories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-[#1a1a24]">
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 下载链接 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              下载链接 <span className="text-red-400">*</span>
            </label>
            <input
              type="url"
              value={form.download_url}
              onChange={e => setForm(f => ({ ...f, download_url: e.target.value }))}
              placeholder="例如：https://pan.baidu.com/s/xxxxx"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
              required
            />
            <p className="text-gray-600 text-xs mt-1">支持网盘链接、直链等，用户将通过此链接获取资源</p>
          </div>

          {/* 资源描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">资源描述</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="简单介绍一下这个资源，比如版本号、包含内容等..."
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
            />
          </div>

          {/* 封面图 + 作者 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">封面图URL</label>
              <input
                type="url"
                value={form.cover_url}
                onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">资源作者</label>
              <input
                type="text"
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                placeholder="原作者名称"
                className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">标签</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="用逗号分隔，例如：RPG, 开放世界, 免费"
              className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>

          <div className="border-t border-white/5 pt-5 mt-5">
            <p className="text-xs text-gray-500 mb-4">以下信息不会公开展示，仅用于管理员联系你（可选）</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">你的昵称</label>
                <input
                  type="text"
                  value={form.submitter_name}
                  onChange={e => setForm(f => ({ ...f, submitter_name: e.target.value }))}
                  placeholder="匿名用户"
                  className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">联系方式</label>
                <input
                  type="text"
                  value={form.submitter_contact}
                  onChange={e => setForm(f => ({ ...f, submitter_contact: e.target.value }))}
                  placeholder="QQ/微信/邮箱"
                  className="w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-bold bg-gradient-to-r from-purple-600 to-violet-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
          >
            {loading ? '提交中...' : '提交资源'}
          </button>
        </form>
      </div>
    </div>
  );
}
