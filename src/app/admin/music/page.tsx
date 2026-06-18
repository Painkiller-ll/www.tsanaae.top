'use client';

import { useState, useEffect } from 'react';
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

export default function AdminMusicPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCover, setNewCover] = useState('');
  const [newMusicUrl, setNewMusicUrl] = useState('');
  // 行内编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editMusicUrl, setEditMusicUrl] = useState('');
  const [editCover, setEditCover] = useState('');

  useEffect(() => {
    fetchTracks();
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMusicUrl || !newTitle) {
      alert('请填写曲目标题和音乐链接');
      return;
    }

    // 简单验证URL格式
    try {
      new URL(newMusicUrl);
    } catch {
      alert('音乐链接格式无效，请输入有效的URL');
      return;
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">音乐管理</h1>

      {/* 添加新曲目 */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-2">添加新曲目</h2>
        <p className="text-sm text-muted-foreground mb-4">
          输入在线音乐链接即可添加曲目，支持直链MP3地址或在线音乐平台分享链接
        </p>
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
            <label className="block text-sm text-muted-foreground mb-1">音乐播放链接 *</label>
            <input
              type="url"
              value={newMusicUrl}
              onChange={e => setNewMusicUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground"
              placeholder="例如：https://example.com/music/song.mp3"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              支持直链MP3/WAV/OGG地址，或在线音乐平台的可播放链接
            </p>
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
                      <input
                        type="number"
                        value={track.sort_order}
                        onChange={e => updateSortOrder(track.id, parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-sm rounded bg-secondary/50 border border-border text-foreground text-center"
                        title="排序"
                      />
                      <button
                        onClick={() => startEdit(track)}
                        className="px-3 py-1 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
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
