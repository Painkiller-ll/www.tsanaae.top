'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MusicTrack } from '@/lib/types';

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(true); // 默认静音
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 加载播放列表
  useEffect(() => {
    fetch('/api/music')
      .then(res => res.json())
      .then(data => {
        if (data.tracks?.length > 0) {
          setTracks(data.tracks);
        }
      })
      .catch(() => {});
  }, []);

  // 初始化 Audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0;
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const onEnded = () => {
      playNext();
    };

    const onWaiting = () => setIsLoading(true);
    const onCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  // 当曲目变化时加载新音频
  useEffect(() => {
    if (tracks.length === 0) return;
    const track = tracks[currentIndex];
    if (!track?.file_url) return;

    const audio = audioRef.current;
    if (!audio) return;

    audio.src = track.file_url;
    audio.load();
  }, [tracks, currentIndex]);

  // 播放/暂停控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying && !isMuted) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, isMuted]);

  // 音量控制
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    if (isMuted) {
      // 首次点击：解除静音并播放
      setIsMuted(false);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [isMuted]);

  const playNext = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const playPrev = useCallback(() => {
    if (tracks.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) return null;

  const currentTrack = tracks[currentIndex];

  return (
    <>
      {/* 迷你模式 - 右下角小图标 */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
          title="音乐播放器"
        >
          {isPlaying && !isMuted ? (
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          )}
          {isMuted && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-muted-foreground rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            </span>
          )}
        </button>
      )}

      {/* 展开模式 - 底部播放器 */}
      {isExpanded && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl">
          {/* 进度条 */}
          <div
            className="h-1 bg-secondary cursor-pointer group hover:h-2 transition-all"
            onClick={seekTo}
          >
            <div
              className="h-full bg-purple-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-4">
            {/* 封面+信息 */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {currentTrack?.cover_image ? (
                <img
                  src={currentTrack.cover_image}
                  alt={currentTrack.title}
                  className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {currentTrack?.title || '未选择曲目'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentTrack?.artist || '未知艺术家'}
                </p>
              </div>
            </div>

            {/* 播放控制 */}
            <div className="flex items-center gap-2">
              <button
                onClick={playPrev}
                className="w-8 h-8 rounded-full hover:bg-secondary/50 flex items-center justify-center text-foreground transition-colors"
                title="上一首"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                </svg>
              </button>

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white transition-colors"
                title={isMuted ? '点击开启声音' : isPlaying ? '暂停' : '播放'}
              >
                {isLoading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                ) : isPlaying && !isMuted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              <button
                onClick={playNext}
                className="w-8 h-8 rounded-full hover:bg-secondary/50 flex items-center justify-center text-foreground transition-colors"
                title="下一首"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                </svg>
              </button>
            </div>

            {/* 时间 */}
            <div className="text-xs text-muted-foreground hidden sm:block min-w-[80px] text-center">
              {formatTime(audioRef.current?.currentTime || 0)} / {formatTime(duration)}
            </div>

            {/* 音量 */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-full hover:bg-secondary/50 flex items-center justify-center text-foreground transition-colors"
                title={isMuted ? '取消静音' : '静音'}
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (v > 0 && isMuted) setIsMuted(false);
                }}
                className="w-20 h-1 accent-purple-500 cursor-pointer"
              />
            </div>

            {/* 播放列表 */}
            <div className="relative">
              <button
                onClick={() => setIsExpanded(false)}
                className="w-8 h-8 rounded-full hover:bg-secondary/50 flex items-center justify-center text-foreground transition-colors"
                title="收起播放器"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* 曲目列表（可展开） */}
          <TrackList
            tracks={tracks}
            currentIndex={currentIndex}
            onSelect={(index) => {
              setCurrentIndex(index);
              setIsPlaying(true);
            }}
          />
        </div>
      )}
    </>
  );
}

function TrackList({ tracks, currentIndex, onSelect }: {
  tracks: MusicTrack[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  const [showList, setShowList] = useState(false);

  if (!showList) {
    return (
      <div className="text-center py-1">
        <button
          onClick={() => setShowList(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          播放列表 ({tracks.length}首) ▲
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-border max-h-48 overflow-y-auto">
      <div className="text-center py-1 sticky top-0 bg-card/95">
        <button
          onClick={() => setShowList(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          收起列表 ▼
        </button>
      </div>
      {tracks.map((track, index) => (
        <button
          key={track.id}
          onClick={() => onSelect(index)}
          className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left ${
            index === currentIndex ? 'bg-purple-600/10 text-purple-400' : 'text-foreground'
          }`}
        >
          <span className="text-xs w-5 text-center text-muted-foreground">
            {index === currentIndex ? (
              <svg className="w-3 h-3 inline animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
            ) : (
              index + 1
            )}
          </span>
          {track.cover_image ? (
            <img src={track.cover_image} alt="" className="w-8 h-8 rounded object-cover" />
          ) : (
            <div className="w-8 h-8 rounded bg-purple-600/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm truncate">{track.title}</p>
            <p className="text-xs text-muted-foreground truncate">{track.artist || '未知'}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
