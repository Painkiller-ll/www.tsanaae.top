'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAudioStore } from '@/lib/audio-store';

const formatTime = (s: number) => {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function MusicPlayer() {
  const store = getAudioStore();

  // 用 useState + subscribe 保持 UI 同步
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // 首次挂载加载曲目
    store.loadTracks();
    // 订阅变化
    const unsub = store.subscribe(() => forceUpdate(n => n + 1));
    return () => { unsub(); };
  }, [store]);

  const currentTrack = store.currentTrack;
  const isEmbedMode = store.isEmbedMode;
  const currentPlayInfo = store.currentPlayInfo;

  const togglePlay = useCallback(() => store.togglePlay(), [store]);
  const prevTrack = useCallback(() => store.prevTrack(), [store]);
  const nextTrack = useCallback(() => store.nextTrack(), [store]);
  const toggleMute = useCallback(() => store.toggleMute(), [store]);
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    store.setVolume(parseFloat(e.target.value));
  }, [store]);
  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    store.seekTo(parseFloat(e.target.value));
  }, [store]);
  const selectTrack = useCallback((idx: number) => {
    store.selectTrack(idx);
  }, [store]);

  const noTracks = store.tracks.length === 0;

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 mb-2">
        <span>🎵</span> 音乐
      </h3>

      {noTracks ? (
        <p className="text-xs text-muted-foreground">暂无音乐</p>
      ) : (
        <>
          {/* 当前曲目信息 */}
          <div className="flex items-center gap-2 mb-2">
            {currentTrack?.cover_image ? (
              <img src={currentTrack.cover_image} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded bg-purple-600/20 flex items-center justify-center shrink-0">
                <span className="text-purple-400 text-sm">♪</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{currentTrack?.title || '未知曲目'}</p>
              <p className="text-[10px] text-muted-foreground truncate">{currentTrack?.artist || '未知艺术家'}</p>
              {store.audioError && !isEmbedMode && (
                <p className="text-[10px] text-red-400 truncate">音频加载失败，正在切换下一首...</p>
              )}
            </div>
          </div>

          {/* 播放区域 - 根据模式切换 */}
          {isEmbedMode && currentPlayInfo ? (
            /* 嵌入播放器模式 */
            <div className="mb-2">
              <iframe
                key={currentPlayInfo.playUrl}
                src={currentPlayInfo.playUrl}
                className="w-full rounded-lg border-0"
                style={{ height: 86 }}
                allow="autoplay"
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
            </div>
          ) : (
            /* 直链播放器模式 */
            <>
              {/* 进度条 */}
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[10px] text-muted-foreground w-7 text-right">{formatTime(store.progress)}</span>
                <input
                  type="range"
                  min={0}
                  max={store.duration || 0}
                  value={store.progress}
                  onChange={handleProgressChange}
                  className="flex-1 h-1 accent-purple-500 cursor-pointer"
                />
                <span className="text-[10px] text-muted-foreground w-7">{formatTime(store.duration)}</span>
              </div>

              {/* 播放控制 */}
              <div className="flex items-center justify-center gap-1 mb-2">
                <button onClick={prevTrack} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="上一首">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button onClick={togglePlay} className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-colors" title={store.isPlaying ? '暂停' : '播放'}>
                  {store.isLoading ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : store.isPlaying ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <button onClick={nextTrack} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="下一首">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
                <button onClick={toggleMute} className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-1" title={store.isMuted ? '取消静音' : '静音'}>
                  {store.isMuted ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                  )}
                </button>
              </div>

              {/* 音量 */}
              <div className="flex items-center gap-1.5">
                <svg className="w-3 h-3 text-muted-foreground shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3z"/></svg>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={store.isMuted ? 0 : store.volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1 accent-purple-500 cursor-pointer"
                />
              </div>
            </>
          )}

          {/* 播放列表 */}
          {store.tracks.length > 1 && (
            <div className="mt-2 border-t border-border pt-2 max-h-24 overflow-y-auto">
              {store.tracks.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => selectTrack(idx)}
                  className={`w-full text-left text-[10px] py-0.5 px-1 rounded truncate transition-colors ${
                    idx === store.currentIndex ? 'text-purple-400 bg-purple-600/10' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {track.title} {track.artist ? `- ${track.artist}` : ''}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
