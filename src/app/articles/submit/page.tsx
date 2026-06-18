'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SubmitArticlePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorContact, setAuthorContact] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setResult({ success: false, message: '标题和内容不能为空' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          author_name: authorName.trim() || '匿名用户',
          author_contact: authorContact.trim(),
          category: category.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          cover_image: coverImage.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: '文章提交成功！等待管理员审核后将在网站展示。' });
        setTitle('');
        setContent('');
        setAuthorName('');
        setAuthorContact('');
        setCategory('');
        setTags('');
        setCoverImage('');
      } else {
        setResult({ success: false, message: data.error || '提交失败，请稍后重试' });
      }
    } catch {
      setResult({ success: false, message: '网络错误，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-color, #0f0f13)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="mb-6">
          <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--accent-color, #7c3aed)' }}>
            ← 返回首页
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-white">发布文章</h1>
        <p className="text-sm mb-6" style={{ color: '#71717a' }}>
          提交后需管理员审核通过才会在网站展示，请确保内容合规
        </p>

        {result && (
          <div className={`mb-6 p-4 rounded-lg border ${
            result.success
              ? 'bg-green-900/20 border-green-800 text-green-400'
              : 'bg-red-900/20 border-red-800 text-red-400'
          }`}>
            {result.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              文章标题 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="输入文章标题"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {/* 作者名 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">昵称</label>
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="不填则显示匿名用户"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">联系方式</label>
              <input
                type="text"
                value={authorContact}
                onChange={e => setAuthorContact(e.target.value)}
                placeholder="QQ/微信/邮箱（可选，不公开）"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* 分类+标签 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">分类</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-purple-500/50 bg-[#1a1a24] text-purple-300 focus:outline-none focus:border-purple-400 [&>option]:bg-[#1a1a24] [&>option]:text-gray-200"
              >
                <option value="">请选择分类（可选）</option>
                <option value="学习资料">学习资料</option>
                <option value="影视剧">影视剧</option>
                <option value="音乐">音乐</option>
                <option value="游戏">游戏</option>
                <option value="小说">小说</option>
                <option value="实用软件">实用软件</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">标签</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="用逗号分隔，如：教程,推荐"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* 封面图 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">封面图片URL</label>
            <input
              type="text"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              placeholder="可选，填入图片链接"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              文章内容 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="写下你的文章内容..."
              rows={12}
              className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-y"
              required
            />
          </div>

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-lg font-medium text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent-color, #7c3aed)' }}
          >
            {submitting ? '提交中...' : '提交文章'}
          </button>

          <p className="text-xs text-center" style={{ color: '#71717a' }}>
            提交即表示您同意遵守社区规范，违规内容将被拒绝展示
          </p>
        </form>
      </div>
    </div>
  );
}
