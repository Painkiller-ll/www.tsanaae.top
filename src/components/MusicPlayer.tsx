'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MusicTrack } from '@/lib/types';

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 加载播放列表
  useEffect(() => {
    fetch('/api/music')
      .then(res => res.json())
      .then(data => setTracks(data.tracks || []))
      .catch(() => {});
  }, []);

  // 初始化 audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.5;
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const onEnded = () => {
      if (tracks.length > 1) {
        setCurrentIndex(prev => (prev + 1) % tracks.length);
      } else {
        setIsPlaying(false);
      }
    };
    const onLoadedData = () => {
      setIsLoading(false);
      setDuration(audio.duration || 0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('loadeddata', onLoadedData);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('loadeddata', onLoadedData);
    };
  }, [tracks.length]);

  // 切歌
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    const track = tracks[currentIndex];
    if (track?.file_url) {
      setIsLoading(true);
      audio.src = track.file_url;
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, tracks]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // 首次播放解除静音
      if (isMuted) {
        setIsMuted(false);
        audio.muted = false;
      }
      if (!audio.src) {
        const track = tracks[currentIndex];
        if (track?.file_url) {
          audio.src = track.file_url;
        }
      }
      audio.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isPlaying, isMuted, tracks, currentIndex]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v;
      if (v === 0) {
        setIsMuted(true);
        audioRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        audioRef.current.muted = false;
      }
    }
  }, [isMuted]);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setProgress(time);
  }, [duration]);

  const prevTrack = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + tracks.length) % tracks.length);
  }, [tracks.length]);

  const nextTrack = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % tracks.length);
  }, [tracks.length]);

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const currentTrack = tracks[currentIndex];
  const noTracks = tracks.length === 0;

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
            </div>
          </div>

          {/* 进度条 */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] text-muted-foreground w-7 text-right">{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={handleProgressChange}
              className="flex-1 h-1 accent-purple-500 cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground w-7">{formatTime(duration)}</span>
          </div>

          {/* 播放控制 */}
          <div className="flex items-center justify-center gap-1 mb-2">
            <button onClick={prevTrack} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="上一首">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button onClick={togglePlay} className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white transition-colors" title={isPlaying ? '暂停' : '播放'}>
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              ) : isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button onClick={nextTrack} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="下一首">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <button onClick={toggleMute} className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-1" title={isMuted ? '取消静音' : '静音'}>
              {isMuted ? (
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
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1 accent-purple-500 cursor-pointer"
            />
          </div>

          {/* 播放列表（紧凑） */}
          {tracks.length > 1 && (
            <div className="mt-2 border-t border-border pt-2 max-h-24 overflow-y-auto">
              {tracks.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => { setCurrentIndex(idx); if (!isPlaying) togglePlay(); }}
                  className={`w-full text-left text-[10px] py-0.5 px-1 rounded truncate transition-colors ${
                    idx === currentIndex ? 'text-purple-400 bg-purple-600/10' : 'text-muted-foreground hover:text-foreground'
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
