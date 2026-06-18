'use client';

import { useState, useEffect, useRef } from 'react';
import { adminFetch, safeJson } from '@/lib/admin-fetch';

interface MusicTrack {
  id: string;
  title: string;
  artist: string | null;
  cover_image: string | null;
  file_key: string;
  duration: number;
  sort_order: number;
  is_active: boolean;
  play_count: number;
  created_at: string;
}

// 检测链接是否为直链音频格式
function isDirectAudioUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(mp3|wav|ogg|flac|m4a|aac|wma)(\?.*)?$/.test(pathname);
  } catch {
    return false;
  }
}

// 检测链接是否为音乐平台分享链接（无法直接播放）
function isPlatformShareLink(url: string): { platform: string; warn: boolean } {
  const platforms: Record<string, RegExp> = {
    'QQ音乐': /y\.qq\.com|c[0-9]*\.y\.qq\.com/,
    '网易云音乐': /music\.163\.com/,
    '酷狗音乐': /kugou\.com/,
    '酷我音乐': /kuwo\.cn/,
    '咪咕音乐': /migu\.cn/,
    'Spotify': /spotify\.com/,
    'Apple Music': /music\.apple\.com/,
  };
  for (const [name, reg] of Object.entries(platforms)) {
    if (reg.test(url)) return { platform: name, warn: true };
  }
  return { platform: '', warn: false };
}

export default function AdminMusicPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCover, setNewCover] = useState('');
  const [newMusicUrl, setNewMusicUrl] = useState('');
  // 试听状态
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'playing' | 'error'>('idle');
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  // 行内编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editMusicUrl, setEditMusicUrl] = useState('');
  const [editCover, setEditCover] = useState('');

  useEffect(() => {
    fetchTracks();
    return () => {
      // 清理试听音频
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const fetchTracks = async () => {
    try {
      const res = await adminFetch('/api/admin/music');
      const data = await safeJson<{ tracks?: MusicTrack[] }>(res);
      setTracks(data.tracks || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // 试听
  const testPlay = (url: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (!url) {
      setPreviewUrl('');
      setPreviewStatus('idle');
      return;
    }
    setPreviewUrl(url);
    setPreviewStatus('playing');
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    previewAudioRef.current = audio;
    audio.src = url;
    audio.play().catch(() => {
      setPreviewStatus('error');
    });
    audio.addEventListener('canplay', () => {
      setPreviewStatus('playing');
    });
    audio.addEventListener('error', () => {
      setPreviewStatus('error');
    });
  };

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewUrl('');
    setPreviewStatus('idle');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMusicUrl || !newTitle) {
      alert('请填写曲目标题和音乐链接');
      return;
    }

    // 验证URL格式
    try {
      new URL(newMusicUrl);
    } catch {
      alert('音乐链接格式无效，请输入有效的URL');
      return;
    }

    // 检测是否为平台分享链接
    const { platform, warn } = isPlatformShareLink(newMusicUrl);
    if (warn) {
      const confirmed = confirm(
        `⚠️ 你输入的是${platform}的分享链接，不是音频直链，播放器无法直接播放。\n\n` +
        `你需要找到该歌曲的 MP3 直链地址（通常以 .mp3 结尾）。\n\n` +
        `获取直链的方法：\n` +
        `1. 在浏览器中打开歌曲页面，按F12打开开发者工具\n` +
        `2. 切换到 Network（网络）标签，筛选 Media（媒体）\n` +
        `3. 播放歌曲，找到 .mp3 结尾的请求，复制其URL\n\n` +
        `仍要添加此链接吗？（大概率无法播放）`
      );
      if (!confirmed) return;
    }

    setAdding(true);
    try {
      const res = await adminFetch('/api/admin/music', {
        method: 'POST',
        body: {
          title: newTitle,
          artist: newArtist || null,
          cover_image: newCover || null,
          music_url: newMusicUrl,
        },
      });
      const data = await safeJson<{ track?: MusicTrack; error?: string }>(res);

      if (data.track) {
        setTracks(prev => [...prev, data.track!]);
        setNewTitle('');
        setNewArtist('');
        setNewCover('');
        setNewMusicUrl('');
        stopPreview();
      } else {
        alert(data.error || '添加失败');
      }
    } catch (err) {
      alert('添加失败: ' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setAdding(false);
    }
  };

  const toggleActive = async (track: MusicTrack) => {
    try {
      const res = await adminFetch('/api/admin/music', {
        method: 'PUT',
        body: { id: track.id, is_active: !track.is_active },
      });
      const data = await safeJson<{ track?: MusicTrack }>(res);
      if (data.track) {
        setTracks(prev => prev.map(t => t.id === track.id ? { ...t, is_active: !t.is_active } : t));
      }
    } catch {
      // ignore
    }
  };

  const deleteTrack = async (id: string) => {
    if (!confirm('确定删除这首曲目？')) return;
    try {
      const res = await adminFetch(`/api/admin/music?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTracks(prev => prev.filter(t => t.id !== id));
      }
    } catch {
      // ignore
    }
  };

  const updateSortOrder = async (id: string, sortOrder: number) => {
    try {
      const res = await adminFetch('/api/admin/music', {
        method: 'PUT',
        body: { id, sort_order: sortOrder },
      });
      const data = await safeJson<{ track?: MusicTrack }>(res);
      if (data.track) {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, sort_order: sortOrder } : t));
      }
    } catch {
      // ignore
    }
  };

  const startEdit = (track: MusicTrack) => {
    setEditingId(track.id);
    setEditTitle(track.title);
    setEditArtist(track.artist || '');
    setEditMusicUrl(track.file_key);
    setEditCover(track.cover_image || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    if (!editTitle || !editMusicUrl) {
      alert('标题和音乐链接不能为空');
      return;
    }
    try {
      new URL(editMusicUrl);
    } catch {
      alert('音乐链接格式无效');
      return;
    }

    // 同样检测平台链接
    const { platform, warn } = isPlatformShareLink(editMusicUrl);
    if (warn) {
      const confirmed = confirm(
        `⚠️ 这是${platform}的分享链接，不是音频直链，播放器无法直接播放。\n\n仍要保存吗？`
      );
      if (!confirmed) return;
    }

    try {
      const res = await adminFetch('/api/admin/music', {
        method: 'PUT',
        body: {
          id,
          title: editTitle,
          artist: editArtist || null,
          music_url: editMusicUrl,
          cover_image: editCover || null,
        },
      });
      const data = await safeJson<{ track?: MusicTrack; error?: string }>(res);
      if (data.track) {
        setTracks(prev => prev.map(t => t.id === id ? {
          ...t,
          title: editTitle,
          artist: editArtist || null,
          file_key: editMusicUrl,
          cover_image: editCover || null,
        } : t));
        setEditingId(null);
      } else {
        alert(data.error || '更新失败');
      }
    } catch (err) {
      alert('更新失败: ' + (err instanceof Error ? err.message : '网络错误'));
    }
  };

  // 当前输入链接的提示信息
  const urlHint = (() => {
    if (!newMusicUrl) return null;
    try {
      new URL(newMusicUrl);
    } catch {
      return { type: 'error' as const, text: '链接格式无效' };
    }
    if (isDirectAudioUrl(newMusicUrl)) {
      return { type: 'success' as const, text: '音频直链，可正常播放' };
    }
    const { platform, warn } = isPlatformShareLink(newMusicUrl);
    if (warn) {
      return { type: 'warning' as const, text: `${platform}分享链接，非音频直链，无法直接播放。需要找到 .mp3 结尾的直链地址` };
    }
    return { type: 'info' as const, text: '非标准音频格式链接，建议先试听确认能否播放' };
  })();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">音乐管理</h1>

      {/* 使用说明 */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">如何获取音乐直链？</h3>
        <ol className="text-xs text-blue-300/80 space-y-1 list-decimal list-inside">
          <li>在浏览器中打开音乐平台（QQ音乐、网易云等）的歌曲页面</li>
          <li>按 <kbd className="px-1 py-0.5 bg-blue-600/20 rounded text-blue-300">F12</kbd> 打开开发者工具，切换到 Network（网络）标签</li>
          <li>在筛选框输入 <code className="px-1 py-0.5 bg-blue-600/20 rounded text-blue-300">.mp3</code> 或点击 Media（媒体）筛选</li>
          <li>播放歌曲，列表中会出现 .mp3 结尾的请求，右键复制该URL</li>
          <li>粘贴到下方"音乐播放链接"输入框，点击试听验证</li>
        </ol>
        <p className="text-xs text-blue-300/60 mt-2">
          注意：只有以 .mp3/.wav/.ogg 等结尾的直链才能播放，平台分享页面链接（如 y.qq.com/xxx）无法使用
        </p>
      </div>

      {/* 添加新曲目 */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">添加新曲目</h2>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">曲目标题 *</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground"
              placeholder="例如：夜曲"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">艺术家</label>
            <input
              type="text"
              value={newArtist}
              onChange={e => setNewArtist(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground"
              placeholder="例如：周杰伦"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">音乐播放链接 * <span className="text-xs font-normal">（必须是音频直链，以 .mp3/.wav/.ogg 等结尾）</span></label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newMusicUrl}
                onChange={e => { setNewMusicUrl(e.target.value); stopPreview(); }}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground"
                placeholder="例如：https://example.com/music/song.mp3"
                required
              />
              <button
                type="button"
                onClick={() => testPlay(newMusicUrl)}
                disabled={!newMusicUrl}
                className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-30 transition-colors text-sm whitespace-nowrap"
              >
                {previewStatus === 'playing' ? '试听中...' : '试听'}
              </button>
              {previewStatus !== 'idle' && (
                <button
                  type="button"
                  onClick={stopPreview}
                  className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-colors text-sm"
                >
                  停止
                </button>
              )}
            </div>
            {/* 链接类型提示 */}
            {urlHint && (
              <div className={`mt-1.5 text-xs flex items-center gap-1 ${
                urlHint.type === 'success' ? 'text-green-400' :
                urlHint.type === 'warning' ? 'text-amber-400' :
                urlHint.type === 'error' ? 'text-red-400' :
                'text-muted-foreground'
              }`}>
                <span>{urlHint.type === 'success' ? '✓' : urlHint.type === 'warning' ? '⚠' : urlHint.type === 'error' ? '✗' : 'ℹ'}</span>
                {urlHint.text}
              </div>
            )}
            {previewStatus === 'error' && (
              <p className="mt-1 text-xs text-red-400">试听失败：该链接无法播放，请确认是音频直链地址</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-muted-foreground mb-1">封面图片URL</label>
            <input
              type="text"
              value={newCover}
              onChange={e => setNewCover(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground"
              placeholder="封面图片链接（可选）"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
            >
              {adding ? '添加中...' : '添加曲目'}
            </button>
          </div>
        </form>
      </div>

      {/* 曲目列表 */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">曲目列表 ({tracks.length}首)</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">加载中...</div>
        ) : tracks.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">暂无曲目，请添加音乐</div>
        ) : (
          <div className="divide-y divide-border">
            {tracks.map((track) => (
              <div key={track.id} className="px-6 py-4 hover:bg-secondary/20 transition-colors">
                {editingId === track.id ? (
                  /* 编辑模式 */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">标题</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">艺术家</label>
                      <input
                        type="text"
                        value={editArtist}
                        onChange={e => setEditArtist(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">音乐链接</label>
                      <input
                        type="url"
                        value={editMusicUrl}
                        onChange={e => setEditMusicUrl(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-muted-foreground mb-1">封面图片URL</label>
                      <input
                        type="text"
                        value={editCover}
                        onChange={e => setEditCover(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <button
                        onClick={() => saveEdit(track.id)}
                        className="px-4 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 展示模式 */
                  <div className="flex items-center gap-4">
                    {/* 封面 */}
                    {track.cover_image ? (
                      <img src={track.cover_image} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                        </svg>
                      </div>
                    )}

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground truncate">{track.title}</p>
                        {!track.is_active && (
                          <span className="px-1.5 py-0.5 text-xs bg-muted-foreground/20 text-muted-foreground rounded">已禁用</span>
                        )}
                        {!isDirectAudioUrl(track.file_key) && (
                          <span className="px-1.5 py-0.5 text-xs bg-amber-600/20 text-amber-400 rounded">非直链</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{track.artist || '未知艺术家'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate" title={track.file_key}>
                        链接: {track.file_key}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        播放 {track.play_count} 次 · 排序 {track.sort_order}
                      </p>
                    </div>

                    {/* 操作 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => testPlay(track.file_key)}
                        className="px-3 py-1 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                      >
                        试听
                      </button>
                      <input
                        type="number"
                        value={track.sort_order}
                        onChange={e => updateSortOrder(track.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-sm rounded bg-secondary/50 border border-border text-foreground text-center"
                        title="排序"
                      />
                      <button
                        onClick={() => startEdit(track)}
                        className="px-3 py-1 text-sm rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => toggleActive(track)}
                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                          track.is_active
                            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                            : 'bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30'
                        }`}
                      >
                        {track.is_active ? '启用' : '禁用'}
                      </button>
                      <button
                        onClick={() => deleteTrack(track.id)}
                        className="px-3 py-1 text-sm rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
