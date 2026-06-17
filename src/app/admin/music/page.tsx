'use client';

import { useState, useEffect, useRef } from 'react';
import { adminFetch } from '@/lib/admin-fetch';

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
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newCover, setNewCover] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const res = await adminFetch('/api/admin/music');
      const data = await res.json();
      setTracks(data.tracks || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !newTitle) {
      alert('请选择音乐文件并填写标题');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', newTitle);
      if (newArtist) formData.append('artist', newArtist);
      if (newCover) formData.append('cover_image', newCover);
      formData.append('sort_order', String(tracks.length));

      const res = await adminFetch('/api/admin/music', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.track) {
        setTracks(prev => [...prev, data.track]);
        setNewTitle('');
        setNewArtist('');
        setNewCover('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        alert(data.error || '上传失败');
      }
    } catch {
      alert('上传失败');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (track: MusicTrack) => {
    try {
      const res = await adminFetch('/api/admin/music', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: track.id, is_active: !track.is_active }),
      });
      const data = await res.json();
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
      const res = await fetch(`/api/admin/music?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTracks(prev => prev.filter(t => t.id !== id));
      }
    } catch {
      // ignore
    }
  };

  const updateTrack = async (id: string, field: string, value: string | number) => {
    try {
      const res = await adminFetch('/api/admin/music', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      const data = await res.json();
      if (data.track) {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">音乐管理</h1>

      {/* 上传区域 */}
      <div className="bg-card rounded-xl p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">上传新曲目</h2>
        <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">音乐文件 *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-500"
            />
            <p className="text-xs text-muted-foreground mt-1">支持 MP3, WAV, OGG, FLAC 格式</p>
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">曲目标题 *</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground"
              placeholder="输入曲目标题"
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
              placeholder="输入艺术家名称"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-1">封面图片URL</label>
            <input
              type="text"
              value={newCover}
              onChange={e => setNewCover(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground"
              placeholder="输入封面图片URL（可选）"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
            >
              {uploading ? '上传中...' : '上传曲目'}
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
          <div className="p-6 text-center text-muted-foreground">暂无曲目，请上传音乐</div>
        ) : (
          <div className="divide-y divide-border">
            {tracks.map((track) => (
              <div key={track.id} className="px-6 py-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                {/* 封面 */}
                {track.cover_image ? (
                  <img src={track.cover_image} alt="" className="w-12 h-12 rounded-md object-cover" />
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
                  <p className="text-xs text-muted-foreground mt-1">
                    播放 {track.play_count} 次 · 排序 {track.sort_order}
                  </p>
                </div>

                {/* 编辑 */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={track.sort_order}
                    onChange={e => updateTrack(track.id, 'sort_order', parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-sm rounded bg-secondary/50 border border-border text-foreground text-center"
                    title="排序"
                  />
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
