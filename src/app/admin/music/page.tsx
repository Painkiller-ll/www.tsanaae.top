'use client';

import { useState, useEffect, useRef } from 'react';
import { adminFetch, safeJson } from '@/lib/admin-fetch';
import { analyzeMusicUrl, getDirectLinkHint, isDirectAudioUrl } from '@/lib/music-utils';

interface MusicTrack {
  id: string;
  title: string;
  artist: string | null;
  cover_image: string | null;
  file_url: string;
  duration: number;
  sort_order: number;
  is_active: boolean;
  play_count: number;
  created_at: string;
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

  // 试听（仅直链模式有效）
  const testPlay = (url: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (!url) {
      setPreviewStatus('idle');
      return;
    }
    const info = analyzeMusicUrl(url);
    if (info.playType === 'embed') {
      // 嵌入模式无法用Audio试听，标记为playing（表示嵌入可用）
      setPreviewStatus('playing');
      return;
    }
    setPreviewStatus('playing');
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    previewAudioRef.current = audio;
    audio.src = info.playUrl;
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
    setPreviewStatus('idle');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMusicUrl || !newTitle) {
      alert('请填写曲目标题和音乐链接');
      return;
    }

    try {
      new URL(newMusicUrl);
    } catch {
      alert('音乐链接格式无效，请输入有效的URL');
      return;
    }

    // 分析链接类型
    const info = analyzeMusicUrl(newMusicUrl);

    // 平台链接但无法自动转换时给出警告
    if (info.isPlatformLink && info.playType !== 'embed') {
      alert(
        `⚠️ ${info.platform}的分享链接无法直接播放。\n\n` +
        `推荐以下方式：\n` +
        `1. 使用网易云音乐歌曲链接（可自动转为嵌入播放器）\n` +
        `2. 获取MP3直链地址（F12 → Network → 筛选 .mp3）\n` +
        `3. 上传本地MP3文件（需先配置Nginx上传大小限制）`
      );
      return;
    }

    setAdding(true);
    try {
      // 存储原始URL到数据库，播放时再分析
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
    setEditMusicUrl(track.file_url);
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
          file_url: editMusicUrl,
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
  const urlHint = getDirectLinkHint(newMusicUrl);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">音乐管理</h1>

      {/* 使用说明 */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">支持的音乐添加方式</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-blue-600/10 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-300 mb-1">方式一：网易云音乐链接</p>
            <p className="text-[10px] text-blue-300/70">
              粘贴网易云歌曲页面链接，系统自动转为嵌入播放器，无需直链。非VIP歌曲可完整播放。
            </p>
            <p className="text-[10px] text-blue-400/60 mt-1">
              示例：https://music.163.com/#/song?id=123456
            </p>
          </div>
          <div className="bg-green-600/10 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-300 mb-1">方式二：MP3直链地址</p>
            <p className="text-[10px] text-green-300/70">
              以 .mp3/.wav/.ogg 等结尾的音频直链URL。可通过F12开发者工具抓取。
            </p>
            <p className="text-[10px] text-green-400/60 mt-1">
              示例：https://example.com/song.mp3
            </p>
          </div>
          <div className="bg-amber-600/10 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-300 mb-1">方式三：嵌入播放器链接</p>
            <p className="text-[10px] text-amber-300/70">
              任何平台的iframe外链播放器URL，需自行获取嵌入代码中的src地址。
            </p>
            <p className="text-[10px] text-amber-400/60 mt-1">
              示例：https://music.163.com/outchain/player?type=2&amp;id=xxx
            </p>
          </div>
        </div>
        <p className="text-xs text-blue-300/60 mt-3">
          注意：QQ音乐VIP歌曲的直链仅为试听版，建议优先使用网易云免费歌曲或自行上传MP3文件。
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
            <label className="block text-sm text-muted-foreground mb-1">音乐链接 * <span className="text-xs font-normal">（支持网易云链接、MP3直链、嵌入播放器URL）</span></label>
            <div className="flex gap-2">
              <input
                type="url"
                value={newMusicUrl}
                onChange={e => { setNewMusicUrl(e.target.value); stopPreview(); }}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground"
                placeholder="粘贴网易云歌曲链接、MP3直链或嵌入播放器URL"
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
              <p className="mt-1 text-xs text-red-400">试听失败：该链接无法播放，请确认是音频直链或有效的嵌入URL</p>
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
            {tracks.map((track) => {
              const trackInfo = analyzeMusicUrl(track.file_url);
              return (
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
                          {/* 播放类型标签 */}
                          {trackInfo.playType === 'embed' ? (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-600/20 text-blue-400 rounded">嵌入播放</span>
                          ) : !isDirectAudioUrl(track.file_url) ? (
                            <span className="px-1.5 py-0.5 text-xs bg-amber-600/20 text-amber-400 rounded">非直链</span>
                          ) : null}
                          {trackInfo.platform && (
                            <span className="px-1.5 py-0.5 text-xs bg-purple-600/20 text-purple-400 rounded">{trackInfo.platform}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{track.artist || '未知艺术家'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate" title={track.file_url}>
                          链接: {track.file_url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          播放 {track.play_count} 次 · 排序 {track.sort_order}
                        </p>
                      </div>

                      {/* 操作 */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => testPlay(track.file_url)}
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
