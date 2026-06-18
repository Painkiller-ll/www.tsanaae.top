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

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  url: string;
  type: 'embed' | 'direct';
  platform: string;
  isFree: boolean;
  duration: number;
}

export default function AdminMusicPage() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // 搜索相关
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');

  // 手动添加
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCover, setNewCover] = useState('');
  const [newMusicUrl, setNewMusicUrl] = useState('');
  const [addMode, setAddMode] = useState<'search' | 'manual'>('search');

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

  // 搜索音乐
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    setSearching(true);
    setSearchMessage('');
    setSearchResults([]);
    try {
      const res = await fetch(`/api/music/search?keyword=${encodeURIComponent(searchKeyword)}&platform=all`);
      const data = await safeJson<{ results?: SearchResult[]; error?: string; message?: string }>(res);
      if (data.error) {
        setSearchMessage(data.error);
      } else if (data.results && data.results.length > 0) {
        setSearchResults(data.results);
        setSearchMessage('');
      } else {
        setSearchMessage(data.message || '未找到相关歌曲，换个关键词试试');
      }
    } catch {
      setSearchMessage('搜索失败，请稍后重试');
    } finally {
      setSearching(false);
    }
  };

  // 从搜索结果添加歌曲
  const addFromSearch = async (song: SearchResult) => {
    setAdding(true);
    try {
      const res = await adminFetch('/api/admin/music', {
        method: 'POST',
        body: {
          title: song.title,
          artist: song.artist || null,
          cover_image: song.cover || null,
          music_url: song.url,
        },
      });
      const data = await safeJson<{ track?: MusicTrack; error?: string }>(res);
      if (data.track) {
        setTracks(prev => [...prev, data.track!]);
        // 从搜索结果中标记已添加
        setSearchResults(prev => prev.map(r => r.id === song.id ? { ...r, added: true } as SearchResult & { added?: boolean } : r));
      } else {
        alert(data.error || '添加失败');
      }
    } catch (err) {
      alert('添加失败: ' + (err instanceof Error ? err.message : '网络错误'));
    } finally {
      setAdding(false);
    }
  };

  // 批量添加搜索结果
  const addAllFromSearch = async () => {
    const notAdded = searchResults.filter(r => !(r as SearchResult & { added?: boolean }).added);
    if (notAdded.length === 0) return;
    if (!confirm(`确定添加 ${notAdded.length} 首歌曲？`)) return;

    setAdding(true);
    let success = 0;
    for (const song of notAdded) {
      try {
        const res = await adminFetch('/api/admin/music', {
          method: 'POST',
          body: {
            title: song.title,
            artist: song.artist || null,
            cover_image: song.cover || null,
            music_url: song.url,
          },
        });
        const data = await safeJson<{ track?: MusicTrack }>(res);
        if (data.track) {
          setTracks(prev => [...prev, data.track!]);
          success++;
        }
      } catch {
        // skip
      }
    }
    setAdding(false);
    setSearchResults(prev => prev.map(r => ({ ...r, added: true } as SearchResult & { added?: boolean })));
    alert(`成功添加 ${success}/${notAdded.length} 首`);
  };

  // 试听
  const testPlay = (url: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    if (!url) { setPreviewStatus('idle'); return; }
    const info = analyzeMusicUrl(url);
    if (info.playType === 'embed') {
      setPreviewStatus('playing');
      return;
    }
    setPreviewStatus('playing');
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    previewAudioRef.current = audio;
    audio.src = info.playUrl;
    audio.play().catch(() => setPreviewStatus('error'));
    audio.addEventListener('canplay', () => setPreviewStatus('playing'));
    audio.addEventListener('error', () => setPreviewStatus('error'));
  };

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setPreviewStatus('idle');
  };

  // 手动添加
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMusicUrl || !newTitle) { alert('请填写曲目标题和音乐链接'); return; }
    try { new URL(newMusicUrl); } catch { alert('音乐链接格式无效'); return; }

    const info = analyzeMusicUrl(newMusicUrl);
    if (info.isPlatformLink && info.playType !== 'embed') {
      alert('该分享链接无法直接播放，建议使用搜索功能或获取MP3直链');
      return;
    }

    setAdding(true);
    try {
      const res = await adminFetch('/api/admin/music', {
        method: 'POST',
        body: { title: newTitle, artist: newArtist || null, cover_image: newCover || null, music_url: newMusicUrl },
      });
      const data = await safeJson<{ track?: MusicTrack; error?: string }>(res);
      if (data.track) {
        setTracks(prev => [...prev, data.track!]);
        setNewTitle(''); setNewArtist(''); setNewCover(''); setNewMusicUrl('');
        stopPreview();
      } else { alert(data.error || '添加失败'); }
    } catch (err) { alert('添加失败: ' + (err instanceof Error ? err.message : '网络错误')); }
    finally { setAdding(false); }
  };

  const toggleActive = async (track: MusicTrack) => {
    try {
      const res = await adminFetch('/api/admin/music', { method: 'PUT', body: { id: track.id, is_active: !track.is_active } });
      const data = await safeJson<{ track?: MusicTrack }>(res);
      if (data.track) setTracks(prev => prev.map(t => t.id === track.id ? { ...t, is_active: !t.is_active } : t));
    } catch { /* */ }
  };

  const deleteTrack = async (id: string) => {
    if (!confirm('确定删除这首曲目？')) return;
    try {
      const res = await adminFetch(`/api/admin/music?id=${id}`, { method: 'DELETE' });
      if (res.ok) setTracks(prev => prev.filter(t => t.id !== id));
    } catch { /* */ }
  };

  const updateSortOrder = async (id: string, sortOrder: number) => {
    try {
      const res = await adminFetch('/api/admin/music', { method: 'PUT', body: { id, sort_order: sortOrder } });
      const data = await safeJson<{ track?: MusicTrack }>(res);
      if (data.track) setTracks(prev => prev.map(t => t.id === id ? { ...t, sort_order: sortOrder } : t));
    } catch { /* */ }
  };

  const startEdit = (track: MusicTrack) => {
    setEditingId(track.id); setEditTitle(track.title); setEditArtist(track.artist || ''); setEditMusicUrl(track.file_url); setEditCover(track.cover_image || '');
  };
  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (id: string) => {
    if (!editTitle || !editMusicUrl) { alert('标题和音乐链接不能为空'); return; }
    try { new URL(editMusicUrl); } catch { alert('音乐链接格式无效'); return; }
    try {
      const res = await adminFetch('/api/admin/music', {
        method: 'PUT',
        body: { id, title: editTitle, artist: editArtist || null, music_url: editMusicUrl, cover_image: editCover || null },
      });
      const data = await safeJson<{ track?: MusicTrack; error?: string }>(res);
      if (data.track) {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, title: editTitle, artist: editArtist || null, file_url: editMusicUrl, cover_image: editCover || null } : t));
        setEditingId(null);
      } else { alert(data.error || '更新失败'); }
    } catch (err) { alert('更新失败: ' + (err instanceof Error ? err.message : '网络错误')); }
  };

  const urlHint = getDirectLinkHint(newMusicUrl);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">音乐管理</h1>

      {/* 添加模式切换 */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setAddMode('search')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              addMode === 'search' ? 'bg-purple-600 text-white' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            搜索添加
          </button>
          <button
            onClick={() => setAddMode('manual')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              addMode === 'manual' ? 'bg-purple-600 text-white' : 'bg-secondary/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            手动添加
          </button>
        </div>

        {/* 搜索添加模式 */}
        {addMode === 'search' && (
          <div className="space-y-4">
            <div className="bg-purple-600/10 border border-purple-600/30 rounded-xl p-4">
              <p className="text-sm text-purple-300">
                输入歌名或歌手名搜索，点击歌曲即可一键添加到音乐库。同时搜索网易云、酷狗和QQ音乐，免费歌曲可获取直链播放。
              </p>
            </div>

            <div className="flex gap-3">
              <input
                type="text"
                value={searchKeyword}
                onChange={e => setSearchKeyword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 border border-border text-foreground text-base"
                placeholder="输入歌名或歌手，如：周杰伦 夜曲"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !searchKeyword.trim()}
                className="px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors font-medium whitespace-nowrap"
              >
                {searching ? '搜索中...' : '搜索'}
              </button>
            </div>

            {/* 搜索结果 */}
            {searchMessage && (
              <div className="text-center py-4 text-muted-foreground">{searchMessage}</div>
            )}

            {searchResults.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">找到 {searchResults.length} 首歌曲</p>
                  <button
                    onClick={addAllFromSearch}
                    disabled={adding}
                    className="px-4 py-1.5 text-sm rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 disabled:opacity-50 transition-colors"
                  >
                    一键全部添加
                  </button>
                </div>
                <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {searchResults.map((song) => {
                    const added = (song as SearchResult & { added?: boolean }).added;
                    return (
                      <div
                        key={song.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          added ? 'bg-green-600/10 border border-green-600/20' : 'bg-secondary/30 hover:bg-secondary/50 border border-transparent'
                        }`}
                      >
                        {/* 封面 */}
                        {song.cover ? (
                          <img src={song.cover} alt="" className="w-11 h-11 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                            </svg>
                          </div>
                        )}

                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{song.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{song.artist}{song.album ? ` · ${song.album}` : ''}</p>
                        </div>

                        {/* 平台+免费标签 */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            song.platform === 'netease' ? 'bg-red-600/20 text-red-400' :
                            song.platform === 'kugou' ? 'bg-blue-600/20 text-blue-400' :
                            song.platform === 'qq' ? 'bg-cyan-600/20 text-cyan-400' :
                            'bg-purple-600/20 text-purple-400'
                          }`}>
                            {song.platform === 'netease' ? '网易云' : song.platform === 'kugou' ? '酷狗' : song.platform === 'qq' ? 'QQ音乐' : song.platform}
                          </span>
                          {song.isFree ? (
                            <span className="px-2 py-0.5 text-xs rounded bg-green-600/20 text-green-400">免费</span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs rounded bg-amber-600/20 text-amber-400">VIP</span>
                          )}
                        </div>

                        {/* 添加按钮 */}
                        {added ? (
                          <span className="px-3 py-1.5 text-xs bg-green-600/20 text-green-400 rounded-lg shrink-0">已添加</span>
                        ) : (
                          <button
                            onClick={() => addFromSearch(song)}
                            disabled={adding}
                            className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors shrink-0"
                          >
                            添加
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 手动添加模式 */}
        {addMode === 'manual' && (
          <form onSubmit={handleManualAdd} className="space-y-4">
            <div className="bg-amber-600/10 border border-amber-600/30 rounded-xl p-4">
              <p className="text-sm text-amber-300">
                手动添加适合有MP3直链或嵌入播放器URL的情况。如果不确定链接，建议使用「搜索添加」。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">曲目标题 *</label>
                <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground" placeholder="例如：夜曲" required />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">艺术家</label>
                <input type="text" value={newArtist} onChange={e => setNewArtist(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground" placeholder="例如：周杰伦" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-muted-foreground mb-1">音乐链接 * <span className="text-xs font-normal">（MP3直链 / 网易云链接 / 嵌入URL）</span></label>
                <div className="flex gap-2">
                  <input type="url" value={newMusicUrl} onChange={e => { setNewMusicUrl(e.target.value); stopPreview(); }}
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground" placeholder="粘贴音乐链接" required />
                  <button type="button" onClick={() => testPlay(newMusicUrl)} disabled={!newMusicUrl}
                    className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 disabled:opacity-30 transition-colors text-sm whitespace-nowrap">
                    {previewStatus === 'playing' ? '试听中...' : '试听'}
                  </button>
                  {previewStatus !== 'idle' && (
                    <button type="button" onClick={stopPreview}
                      className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-colors text-sm">停止</button>
                  )}
                </div>
                {urlHint && (
                  <div className={`mt-1.5 text-xs flex items-center gap-1 ${
                    urlHint.type === 'success' ? 'text-green-400' : urlHint.type === 'warning' ? 'text-amber-400' : urlHint.type === 'error' ? 'text-red-400' : 'text-muted-foreground'
                  }`}>
                    <span>{urlHint.type === 'success' ? '✓' : urlHint.type === 'warning' ? '⚠' : urlHint.type === 'error' ? '✗' : 'ℹ'}</span>
                    {urlHint.text}
                  </div>
                )}
                {previewStatus === 'error' && (
                  <p className="mt-1 text-xs text-red-400">试听失败：该链接无法播放</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-muted-foreground mb-1">封面图片URL</label>
                <input type="text" value={newCover} onChange={e => setNewCover(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground" placeholder="封面图片链接（可选）" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={adding}
                  className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors">
                  {adding ? '添加中...' : '添加曲目'}
                </button>
              </div>
            </div>
          </form>
        )}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">标题</label>
                        <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground" />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">艺术家</label>
                        <input type="text" value={editArtist} onChange={e => setEditArtist(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-muted-foreground mb-1">音乐链接</label>
                        <input type="url" value={editMusicUrl} onChange={e => setEditMusicUrl(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-muted-foreground mb-1">封面图片URL</label>
                        <input type="text" value={editCover} onChange={e => setEditCover(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground" />
                      </div>
                      <div className="md:col-span-2 flex gap-2">
                        <button onClick={() => saveEdit(track.id)}
                          className="px-4 py-1.5 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors">保存</button>
                        <button onClick={cancelEdit}
                          className="px-4 py-1.5 text-sm rounded-lg bg-secondary/50 border border-border text-foreground hover:bg-secondary transition-colors">取消</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      {track.cover_image ? (
                        <img src={track.cover_image} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground truncate">{track.title}</p>
                          {!track.is_active && <span className="px-1.5 py-0.5 text-xs bg-muted-foreground/20 text-muted-foreground rounded">已禁用</span>}
                          {trackInfo.playType === 'embed' ? (
                            <span className="px-1.5 py-0.5 text-xs bg-blue-600/20 text-blue-400 rounded">嵌入播放</span>
                          ) : isDirectAudioUrl(track.file_url) ? (
                            <span className="px-1.5 py-0.5 text-xs bg-green-600/20 text-green-400 rounded">直链</span>
                          ) : (
                            <span className="px-1.5 py-0.5 text-xs bg-amber-600/20 text-amber-400 rounded">非直链</span>
                          )}
                          {trackInfo.platform && (
                            <span className="px-1.5 py-0.5 text-xs bg-purple-600/20 text-purple-400 rounded">{trackInfo.platform}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{track.artist || '未知艺术家'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate" title={track.file_url}>
                          链接: {track.file_url}
                        </p>
                        <p className="text-xs text-muted-foreground">播放 {track.play_count} 次 · 排序 {track.sort_order}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => testPlay(track.file_url)}
                          className="px-3 py-1 text-sm rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors">试听</button>
                        <input type="number" value={track.sort_order} onChange={e => updateSortOrder(track.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-sm rounded bg-secondary/50 border border-border text-foreground text-center" title="排序" />
                        <button onClick={() => startEdit(track)}
                          className="px-3 py-1 text-sm rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors">编辑</button>
                        <button onClick={() => toggleActive(track)}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            track.is_active ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30'
                          }`}>
                          {track.is_active ? '启用' : '禁用'}
                        </button>
                        <button onClick={() => deleteTrack(track.id)}
                          className="px-3 py-1 text-sm rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors">删除</button>
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
