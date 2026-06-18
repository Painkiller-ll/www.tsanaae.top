/**
 * 全局音频播放器单例
 * 
 * MusicPlayer 组件卸载（侧边栏关闭）时，Audio 对象继续播放。
 * 重新挂载时从单例恢复状态，不会重复创建 Audio。
 */

import type { MusicTrack } from '@/lib/types';
import { analyzeMusicUrl } from '@/lib/music-utils';
import type { MusicPlayType } from '@/lib/music-utils';

interface PlayInfo {
  playType: MusicPlayType;
  playUrl: string;
}

type Listener = () => void;

class AudioStore {
  private audio: HTMLAudioElement;
  private _tracks: MusicTrack[] = [];
  private _currentIndex = 0;
  private _isPlaying = false;
  private _volume = 0.5;
  private _isMuted = true;
  private _progress = 0;
  private _duration = 0;
  private _isLoading = false;
  private _audioError = false;
  private _listeners: Set<Listener> = new Set();
  private _tracksLoaded = false;

  constructor() {
    this.audio = typeof window !== 'undefined' ? new Audio() : (null as any);
    if (this.audio) {
      this.audio.volume = 0.5;
      this.audio.muted = true;

      this.audio.addEventListener('timeupdate', () => {
        this._progress = this.audio.currentTime;
        this._duration = this.audio.duration || 0;
        this.emit();
      });
      this.audio.addEventListener('ended', () => {
        if (this._tracks.length > 1) {
          this._currentIndex = (this._currentIndex + 1) % this._tracks.length;
          this.loadCurrentTrack();
        } else {
          this._isPlaying = false;
          this.emit();
        }
      });
      this.audio.addEventListener('loadeddata', () => {
        this._isLoading = false;
        this._audioError = false;
        this._duration = this.audio.duration || 0;
        this.emit();
      });
      this.audio.addEventListener('error', () => {
        this._isLoading = false;
        this._audioError = true;
        this.emit();
        if (this._tracks.length > 1) {
          setTimeout(() => {
            this._currentIndex = (this._currentIndex + 1) % this._tracks.length;
            this.loadCurrentTrack();
          }, 2000);
        }
      });
    }
  }

  // ---- 订阅 ----
  subscribe(fn: Listener) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }
  private emit() {
    this._listeners.forEach(fn => fn());
  }

  // ---- 加载播放列表（仅首次） ----
  async loadTracks() {
    if (this._tracksLoaded) return;
    this._tracksLoaded = true;
    try {
      const res = await fetch('/api/music');
      const data = await res.json();
      this._tracks = data.tracks || [];
      this.emit();
    } catch {
      this._tracksLoaded = false;
    }
  }

  // ---- 获取播放信息 ----
  private getPlayInfo(track: MusicTrack | undefined): PlayInfo | null {
    if (!track?.file_url) return null;
    const info = analyzeMusicUrl(track.file_url);
    return { playType: info.playType, playUrl: info.playUrl };
  }

  // ---- 加载当前曲目 ----
  private loadCurrentTrack() {
    const track = this._tracks[this._currentIndex];
    const playInfo = this.getPlayInfo(track);

    if (playInfo?.playType === 'embed') {
      // 嵌入模式不操作 audio
      this._audioError = false;
      this.emit();
      return;
    }

    // 直链模式
    if (playInfo?.playUrl) {
      this._isLoading = true;
      this._audioError = false;
      this.audio.src = playInfo.playUrl;
      if (this._isPlaying) {
        this.audio.play().catch(() => {});
      }
      this.emit();
    }
  }

  // ---- 操作方法 ----
  togglePlay() {
    const track = this._tracks[this._currentIndex];
    const playInfo = this.getPlayInfo(track);

    if (playInfo?.playType === 'embed') {
      this._isPlaying = !this._isPlaying;
      this.emit();
      return;
    }

    if (this._isPlaying) {
      this.audio.pause();
      this._isPlaying = false;
    } else {
      if (this._isMuted) {
        this._isMuted = false;
        this.audio.muted = false;
      }
      if (!this.audio.src && playInfo?.playUrl) {
        this.audio.src = playInfo.playUrl;
      }
      this.audio.play().catch(() => {});
      this._isPlaying = true;
    }
    this.emit();
  }

  prevTrack() {
    this._currentIndex = (this._currentIndex - 1 + this._tracks.length) % this._tracks.length;
    this.loadCurrentTrack();
  }

  nextTrack() {
    this._currentIndex = (this._currentIndex + 1) % this._tracks.length;
    this.loadCurrentTrack();
  }

  seekTo(time: number) {
    if (!this._duration) return;
    this.audio.currentTime = time;
    this._progress = time;
    this.emit();
  }

  setVolume(v: number) {
    this._volume = v;
    this.audio.volume = v;
    if (v === 0) {
      this._isMuted = true;
      this.audio.muted = true;
    } else if (this._isMuted) {
      this._isMuted = false;
      this.audio.muted = false;
    }
    this.emit();
  }

  toggleMute() {
    this._isMuted = !this._isMuted;
    this.audio.muted = this._isMuted;
    this.emit();
  }

  selectTrack(idx: number) {
    this._currentIndex = idx;
    this.loadCurrentTrack();
    if (!this._isPlaying) {
      this.togglePlay();
    }
  }

  // ---- Getter ----
  get tracks() { return this._tracks; }
  get currentIndex() { return this._currentIndex; }
  get isPlaying() { return this._isPlaying; }
  get volume() { return this._volume; }
  get isMuted() { return this._isMuted; }
  get progress() { return this._progress; }
  get duration() { return this._duration; }
  get isLoading() { return this._isLoading; }
  get audioError() { return this._audioError; }
  get currentTrack() { return this._tracks[this._currentIndex]; }
  get currentPlayInfo() { return this.getPlayInfo(this.currentTrack); }
  get isEmbedMode() { return this.currentPlayInfo?.playType === 'embed'; }
}

// 全局单例
let _instance: AudioStore | null = null;

export function getAudioStore(): AudioStore {
  if (!_instance && typeof window !== 'undefined') {
    _instance = new AudioStore();
  }
  return _instance!;
}
