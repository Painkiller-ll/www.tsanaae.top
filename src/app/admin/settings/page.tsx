'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Settings {
  site_name: string;
  site_description: string;
  site_bg_color: string;
  site_card_color: string;
  site_accent_color: string;
  site_logo_url: string;
  site_bg_image: string;
  site_footer_text: string;
  wechat_qr_code: string;
  footer_links: { label: string; url: string }[];
  share_text_template: string;
  contact_qq: string;
  contact_wechat: string;
  contact_email: string;
  contact_telegram: string;
  contact_github: string;
  about_text: string;
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>({
    site_name: 'Tsanaae Game',
    site_description: '精选优质游戏资源，发现你的下一款游戏',
    site_bg_color: '#0f0f13',
    site_card_color: '#1a1a24',
    site_accent_color: '#7c3aed',
    site_logo_url: '',
    site_bg_image: '',
    site_footer_text: '© 2025 Tsanaae Game. 精选优质游戏资源导航',
    wechat_qr_code: '',
    footer_links: [],
    share_text_template: '来{site_name}一起玩「{game_title}」吧！',
    contact_qq: '',
    contact_wechat: '',
    contact_email: '',
    contact_telegram: '',
    contact_github: '',
    about_text: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/check').then(r => r.json()).then(d => {
      if (!d.authenticated) router.push('/admin/login');
    });
    fetch('/api/site-settings').then(r => r.json()).then(d => setSettings(prev => ({ ...prev, ...d })));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('保存成功');
      } else {
        setMessage(data.error || '保存失败');
      }
    } catch {
      setMessage('网络错误');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-[#0f0f13] border border-white/[0.08] rounded-lg text-white placeholder-[#71717a] focus:outline-none focus:border-[#7c3aed] transition-colors';
  const labelClass = 'block text-sm text-[#e4e4e7] mb-1.5';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">站点设置</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>

      {message && (
        <div className={`px-4 py-2 rounded-lg text-sm ${message === '保存成功' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          {message}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-2">基本信息</h3>
        <div>
          <label className={labelClass}>站点名称</label>
          <input type="text" value={settings.site_name} onChange={e => setSettings({ ...settings, site_name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>站点描述</label>
          <input type="text" value={settings.site_description} onChange={e => setSettings({ ...settings, site_description: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>页脚文字</label>
          <input type="text" value={settings.site_footer_text} onChange={e => setSettings({ ...settings, site_footer_text: e.target.value })} className={inputClass} />
        </div>
      </div>

      {/* Colors */}
      <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-2">配色方案</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>背景色</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.site_bg_color} onChange={e => setSettings({ ...settings, site_bg_color: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
              <input type="text" value={settings.site_bg_color} onChange={e => setSettings({ ...settings, site_bg_color: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>卡片色</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.site_card_color} onChange={e => setSettings({ ...settings, site_card_color: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
              <input type="text" value={settings.site_card_color} onChange={e => setSettings({ ...settings, site_card_color: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>强调色</label>
            <div className="flex items-center gap-2">
              <input type="color" value={settings.site_accent_color} onChange={e => setSettings({ ...settings, site_accent_color: e.target.value })} className="h-10 w-10 rounded cursor-pointer" />
              <input type="text" value={settings.site_accent_color} onChange={e => setSettings({ ...settings, site_accent_color: e.target.value })} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-2">图片设置</h3>
        <div>
          <label className={labelClass}>Logo URL</label>
          <input type="text" value={settings.site_logo_url} onChange={e => setSettings({ ...settings, site_logo_url: e.target.value })} placeholder="留空使用默认Logo" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>背景图片 URL</label>
          <input type="text" value={settings.site_bg_image} onChange={e => setSettings({ ...settings, site_bg_image: e.target.value })} placeholder="留空使用纯色背景" className={inputClass} />
          {settings.site_bg_image && (
            <div className="mt-2 h-32 rounded-lg overflow-hidden border border-white/[0.08]">
              <img src={settings.site_bg_image} alt="背景预览" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* WeChat & Footer & Share */}
      <div className="bg-[#1a1a24] rounded-xl border border-white/[0.08] p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white mb-2">微信 & 页脚 & 分享</h3>
        <div>
          <label className={labelClass}>微信二维码图片 URL</label>
          <input type="text" value={settings.wechat_qr_code} onChange={e => setSettings({ ...settings, wechat_qr_code: e.target.value })} placeholder="上传微信二维码图片链接" className={inputClass} />
          {settings.wechat_qr_code && (
            <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border border-white/[0.08]">
              <img src={settings.wechat_qr_code} alt="微信二维码预览" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
        <div>
          <label className={labelClass}>页脚链接</label>
          <div className="space-y-2">
            {(settings.footer_links || []).map((link, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={link.label} onChange={e => {
                  const newLinks = [...settings.footer_links];
                  newLinks[i] = { ...newLinks[i], label: e.target.value };
                  setSettings({ ...settings, footer_links: newLinks });
                }} placeholder="链接名称" className={`${inputClass} flex-1`} />
                <input type="text" value={link.url} onChange={e => {
                  const newLinks = [...settings.footer_links];
                  newLinks[i] = { ...newLinks[i], url: e.target.value };
                  setSettings({ ...settings, footer_links: newLinks });
                }} placeholder="链接地址" className={`${inputClass} flex-1`} />
                <button onClick={() => {
                  const newLinks = settings.footer_links.filter((_, j) => j !== i);
                  setSettings({ ...settings, footer_links: newLinks });
                }} className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">删除</button>
              </div>
            ))}
            <button onClick={() => {
              setSettings({ ...settings, footer_links: [...(settings.footer_links || []), { label: '', url: '' }] });
            }} className="px-4 py-2 bg-white/5 text-[#71717a] rounded-lg hover:bg-white/10 transition-colors text-sm">+ 添加链接</button>
          </div>
        </div>
        <div>
          <label className={labelClass}>分享文案模板</label>
          <input type="text" value={settings.share_text_template} onChange={e => setSettings({ ...settings, share_text_template: e.target.value })} placeholder="来{site_name}一起玩「{game_title}」吧！" className={inputClass} />
          <p className="text-xs text-[#71717a] mt-1">支持变量: {'{site_name}'} = 站点名, {'{game_title}'} = 游戏名</p>
        </div>
      </div>

      {/* 联系我们 & 关于 */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">联系我们 & 关于</h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>站长QQ</label>
            <input type="text" value={settings.contact_qq} onChange={e => setSettings({ ...settings, contact_qq: e.target.value })} placeholder="QQ号码" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>微信号</label>
            <input type="text" value={settings.contact_wechat} onChange={e => setSettings({ ...settings, contact_wechat: e.target.value })} placeholder="微信号" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>邮箱</label>
            <input type="email" value={settings.contact_email} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} placeholder="contact@example.com" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Telegram</label>
            <input type="text" value={settings.contact_telegram} onChange={e => setSettings({ ...settings, contact_telegram: e.target.value })} placeholder="Telegram用户名" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>GitHub</label>
            <input type="text" value={settings.contact_github} onChange={e => setSettings({ ...settings, contact_github: e.target.value })} placeholder="GitHub用户名" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>关于本站</label>
            <textarea value={settings.about_text} onChange={e => setSettings({ ...settings, about_text: e.target.value })} placeholder="介绍你的网站..." className={inputClass} rows={4} />
          </div>
        </div>
      </div>
    </div>
  );
}
