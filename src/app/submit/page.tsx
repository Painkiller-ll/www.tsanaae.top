'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { type ResourceCategory } from '@/lib/types';

type Tab = 'resource' | 'article';

export default function SubmitPage() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return searchParams.get('tab') === 'article' ? 'article' : 'resource';
  });

  // ===== 资源投稿 =====
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [subCategories, setSubCategories] = useState<ResourceCategory[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [resSuccess, setResSuccess] = useState(false);
  const [resError, setResError] = useState('');
  const [resForm, setResForm] = useState({
    title: '', description: '', download_url: '', resource_type: '',
    category_id: '', author: '', tags: '', cover_url: '',
    submitter_name: '', submitter_contact: '',
  });

  // ===== 文章投稿 =====
  const [artTopCats, setArtTopCats] = useState<{id:number;name:string;slug:string;icon:string|null}[]>([]);
  const [artLoading, setArtLoading] = useState(false);
  const [artSuccess, setArtSuccess] = useState(false);
  const [artError, setArtError] = useState('');
  const [artForm, setArtForm] = useState({
    title: '', content: '', author_name: '', author_contact: '',
    category: '', tags: '', cover_image: '',
  });

  // 加载分类
  useEffect(() => {
    fetch('/api/resource-categories?top_level=true')
      .then(r => r.json())
      .then(d => {
        const cats = d.data || d || [];
        setCategories(cats);
        setArtTopCats(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!resForm.resource_type) {
      setSubCategories([]);
      setResForm(f => ({ ...f, category_id: '' }));
      return;
    }
    fetch(`/api/resource-categories?parent_type=${resForm.resource_type}`)
      .then(r => r.json())
      .then(d => { setSubCategories(d.data || d || []); })
      .catch(() => { setSubCategories([]); });
  }, [resForm.resource_type]);

  // 资源投稿提交
  const handleResSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResLoading(true);
    setResError('');
    try {
      const res = await fetch('/api/submit-resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...resForm,
          tags: resForm.tags ? resForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          category_id: resForm.category_id ? parseInt(resForm.category_id) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setResError(data.error || '投稿失败'); return; }
      setResSuccess(true);
    } catch { setResError('网络错误，请重试'); }
    finally { setResLoading(false); }
  };

  // 文章投稿提交
  const handleArtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artForm.title.trim() || !artForm.content.trim()) {
      setArtError('标题和内容不能为空');
      return;
    }
    setArtLoading(true);
    setArtError('');
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: artForm.title.trim(),
          content: artForm.content.trim(),
          author_name: artForm.author_name.trim() || '匿名用户',
          author_contact: artForm.author_contact.trim(),
          category: artForm.category.trim(),
          tags: artForm.tags.split(',').map(t => t.trim()).filter(Boolean),
          cover_image: artForm.cover_image.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setArtError(data.error || '提交失败'); return; }
      setArtSuccess(true);
    } catch { setArtError('网络错误，请稍后重试'); }
    finally { setArtLoading(false); }
  };

  // 通用成功页
  const renderSuccess = (msg: string, onContinue: () => void) => (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f13' }}>
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold text-white mb-3">提交成功</h1>
        <p className="text-gray-400 mb-6">{msg}</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-gray-700 hover:bg-gray-600 transition-colors">
            返回首页
          </Link>
          <button onClick={onContinue} className="px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-gradient-to-r from-purple-600 to-violet-500 hover:opacity-90 transition-opacity">
            继续投稿
          </button>
        </div>
      </div>
    </div>
  );

  if (resSuccess) return renderSuccess('你的资源已提交，管理员审核通过后将会在网站上展示', () => {
    setResSuccess(false);
    setResForm({ title: '', description: '', download_url: '', resource_type: '', category_id: '', author: '', tags: '', cover_url: '', submitter_name: '', submitter_contact: '' });
  });

  if (artSuccess) return renderSuccess('文章提交成功，等待管理员审核后将在网站展示', () => {
    setArtSuccess(false);
    setArtForm({ title: '', content: '', author_name: '', author_contact: '', category: '', tags: '', cover_image: '' });
  });

  const inputCls = 'w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white placeholder-gray-600 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors';
  const selectCls = 'w-full rounded-lg border border-white/10 bg-[#1a1a24] px-4 py-2.5 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors appearance-none';
  const labelCls = 'block text-sm font-medium text-gray-300 mb-1.5';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f0f13' }}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/" className="text-sm hover:underline mb-4 inline-block" style={{ color: '#7c3aed' }}>
          ← 返回首页
        </Link>

        {/* Tab 切换 */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-6">
          <button
            onClick={() => setActiveTab('resource')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'resource'
                ? 'bg-gradient-to-r from-purple-600 to-violet-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📦 投稿资源
          </button>
          <button
            onClick={() => setActiveTab('article')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'article'
                ? 'bg-gradient-to-r from-purple-600 to-violet-500 text-white shadow-lg shadow-purple-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            ✏️ 写文章
          </button>
        </div>

        {/* ===== 资源投稿表单 ===== */}
        {activeTab === 'resource' && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">资源投稿</h1>
              <p className="text-gray-500 text-sm mt-1">分享你发现的优质资源，审核通过后将在网站展示</p>
            </div>

            {resError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{resError}</div>
            )}

            <form onSubmit={handleResSubmit} className="space-y-5">
              <div>
                <label className={labelCls}>资源名称 <span className="text-red-400">*</span></label>
                <input type="text" value={resForm.title} onChange={e => setResForm(f => ({ ...f, title: e.target.value }))} placeholder="例如：原神 5.0 完整客户端" className={inputCls} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>资源类型 <span className="text-red-400">*</span></label>
                  <select value={resForm.resource_type} onChange={e => setResForm(f => ({ ...f, resource_type: e.target.value }))} className={selectCls} required>
                    <option value="" className="bg-[#1a1a24]">选择类型</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug} className="bg-[#1a1a24]">{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>子分类</label>
                  <select value={resForm.category_id} onChange={e => setResForm(f => ({ ...f, category_id: e.target.value }))} className={selectCls} disabled={!subCategories.length}>
                    <option value="" className="bg-[#1a1a24]">选择子分类</option>
                    {subCategories.map(cat => (
                      <option key={cat.id} value={cat.id} className="bg-[#1a1a24]">{cat.icon} {cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>下载链接 <span className="text-red-400">*</span></label>
                <input type="url" value={resForm.download_url} onChange={e => setResForm(f => ({ ...f, download_url: e.target.value }))} placeholder="例如：https://pan.baidu.com/s/xxxxx" className={inputCls} required />
                <p className="text-gray-600 text-xs mt-1">支持网盘链接、直链等</p>
              </div>

              <div>
                <label className={labelCls}>资源描述</label>
                <textarea value={resForm.description} onChange={e => setResForm(f => ({ ...f, description: e.target.value }))} placeholder="简单介绍一下这个资源..." rows={3} className={`${inputCls} resize-none`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>封面图URL</label>
                  <input type="url" value={resForm.cover_url} onChange={e => setResForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="https://..." className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>资源作者</label>
                  <input type="text" value={resForm.author} onChange={e => setResForm(f => ({ ...f, author: e.target.value }))} placeholder="原作者名称" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>标签</label>
                <input type="text" value={resForm.tags} onChange={e => setResForm(f => ({ ...f, tags: e.target.value }))} placeholder="用逗号分隔，例如：RPG, 开放世界, 免费" className={inputCls} />
              </div>

              <div className="border-t border-white/5 pt-5 mt-5">
                <p className="text-xs text-gray-500 mb-4">以下信息不会公开展示，仅用于管理员联系你（可选）</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>你的昵称</label>
                    <input type="text" value={resForm.submitter_name} onChange={e => setResForm(f => ({ ...f, submitter_name: e.target.value }))} placeholder="匿名用户" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>联系方式</label>
                    <input type="text" value={resForm.submitter_contact} onChange={e => setResForm(f => ({ ...f, submitter_contact: e.target.value }))} placeholder="QQ/微信/邮箱" className={inputCls} />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={resLoading} className="w-full py-3 rounded-xl text-white font-bold bg-gradient-to-r from-purple-600 to-violet-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40">
                {resLoading ? '提交中...' : '提交资源'}
              </button>
            </form>
          </>
        )}

        {/* ===== 文章投稿表单 ===== */}
        {activeTab === 'article' && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">写文章</h1>
              <p className="text-gray-500 text-sm mt-1">分享你的经验、教程或见解，审核通过后将在网站展示</p>
            </div>

            {artError && (
              <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{artError}</div>
            )}

            <form onSubmit={handleArtSubmit} className="space-y-5">
              <div>
                <label className={labelCls}>文章标题 <span className="text-red-400">*</span></label>
                <input type="text" value={artForm.title} onChange={e => setArtForm(f => ({ ...f, title: e.target.value }))} placeholder="输入文章标题" className={inputCls} required />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>昵称</label>
                  <input type="text" value={artForm.author_name} onChange={e => setArtForm(f => ({ ...f, author_name: e.target.value }))} placeholder="不填则显示匿名用户" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>联系方式</label>
                  <input type="text" value={artForm.author_contact} onChange={e => setArtForm(f => ({ ...f, author_contact: e.target.value }))} placeholder="QQ/微信/邮箱（可选，不公开）" className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>分类</label>
                  <select value={artForm.category} onChange={e => setArtForm(f => ({ ...f, category: e.target.value }))} className={`${selectCls} [&>option]:bg-[#1a1a24] [&>option]:text-gray-200`}>
                    <option value="">请选择分类（可选）</option>
                    {artTopCats.map(c => (
                      <option key={c.id} value={c.name}>{c.icon ? c.icon + ' ' : ''}{c.name}</option>
                    ))}
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>标签</label>
                  <input type="text" value={artForm.tags} onChange={e => setArtForm(f => ({ ...f, tags: e.target.value }))} placeholder="用逗号分隔，如：教程,推荐" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>封面图片URL</label>
                <input type="text" value={artForm.cover_image} onChange={e => setArtForm(f => ({ ...f, cover_image: e.target.value }))} placeholder="可选，填入图片链接" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>文章内容 <span className="text-red-400">*</span></label>
                <textarea value={artForm.content} onChange={e => setArtForm(f => ({ ...f, content: e.target.value }))} placeholder="写下你的文章内容..." rows={12} className={`${inputCls} resize-y`} required />
              </div>

              <button type="submit" disabled={artLoading} className="w-full py-3 rounded-xl text-white font-bold bg-gradient-to-r from-purple-600 to-violet-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40">
                {artLoading ? '提交中...' : '提交文章'}
              </button>

              <p className="text-xs text-center text-gray-500">
                提交即表示您同意遵守社区规范，违规内容将被拒绝展示
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
