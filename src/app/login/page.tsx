'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/user/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败');
        return;
      }

      router.push('/profile');
      router.refresh();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 items-center justify-center rounded-lg bg-[#7c3aed] flex">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">Tsanaae Game</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">用户登录</h1>
          <p className="text-[#71717a]">登录后享受更多功能</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[#1a1a24] p-6 rounded-xl border border-white/[0.08]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-[#e4e4e7] mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
              className="w-full px-4 py-2.5 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white placeholder-[#71717a] focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-[#e4e4e7] mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              className="w-full px-4 py-2.5 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white placeholder-[#71717a] focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-[#71717a]">
            还没有账号？
            <Link href="/register" className="text-[#7c3aed] hover:text-[#a855f7] ml-1">立即注册</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
