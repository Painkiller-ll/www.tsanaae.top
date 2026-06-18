/**
 * 音乐链接工具库
 * 支持检测平台链接、转换嵌入播放URL、区分直链和嵌入模式
 */

export type MusicPlayType = 'audio' | 'embed';

export interface MusicUrlInfo {
  /** 播放类型：audio=音频直链，embed=iframe嵌入 */
  playType: MusicPlayType;
  /** 最终用于播放的URL（直链原样返回，平台链接转为嵌入URL） */
  playUrl: string;
  /** 原始输入URL */
  originalUrl: string;
  /** 平台名称（检测到平台时） */
  platform?: string;
  /** 是否为平台分享链接（非直链） */
  isPlatformLink: boolean;
  /** 提示信息 */
  hint?: string;
}

/** 检测是否为音频直链 */
export function isDirectAudioUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(mp3|wav|ogg|flac|m4a|aac|wma)(\?.*)?$/.test(pathname);
  } catch {
    return false;
  }
}

/** 已知音乐平台检测 */
const PLATFORM_RULES: Array<{ name: string; pattern: RegExp; convert: (url: string) => string | null }> = [
  {
    name: '网易云音乐',
    pattern: /music\.163\.com/,
    convert: (url) => {
      // 从URL中提取歌曲ID
      // 格式1: https://music.163.com/#/song?id=123456
      // 格式2: https://music.163.com/song?id=123456
      // 格式3: https://music.163.com/outchain/player?type=2&id=123456 (已经是嵌入URL)
      const outchainMatch = url.match(/outchain\/player/);
      if (outchainMatch) return url; // 已经是嵌入URL，原样返回

      const idMatch = url.match(/[?&]id=(\d+)/);
      if (idMatch) {
        return `https://music.163.com/outchain/player?type=2&id=${idMatch[1]}&auto=0&height=66`;
      }
      return null;
    },
  },
  {
    name: 'QQ音乐',
    pattern: /y\.qq\.com|c\d*\.y\.qq\.com/,
    convert: (url) => {
      // QQ音乐的外链播放器
      // 格式: https://y.qq.com/n/ryqq/songDetail/003aAYrm3GE0cg
      // 嵌入: https://i.y.qq.com/v8/music/common/play/songmid.html?songmid=003aAYrm3GE0cg
      const songmidMatch = url.match(/songDetail\/([a-zA-Z0-9]+)/);
      if (songmidMatch) {
        return `https://i.y.qq.com/v8/music/common/play/songmid.html?songmid=${songmidMatch[1]}&type=0`;
      }
      // 如果已经是嵌入URL
      if (url.includes('/v8/music/common/play/')) return url;
      return null;
    },
  },
  {
    name: '酷狗音乐',
    pattern: /kugou\.com/,
    convert: () => null, // 酷狗暂不支持自动转换
  },
  {
    name: '酷我音乐',
    pattern: /kuwo\.cn/,
    convert: () => null, // 酷我暂不支持自动转换
  },
];

/** 检测平台并转换URL */
export function analyzeMusicUrl(url: string): MusicUrlInfo {
  // 1. 先验证URL格式
  try {
    new URL(url);
  } catch {
    return {
      playType: 'audio',
      playUrl: url,
      originalUrl: url,
      isPlatformLink: false,
      hint: '链接格式无效',
    };
  }

  // 2. 检查是否为音频直链
  if (isDirectAudioUrl(url)) {
    return {
      playType: 'audio',
      playUrl: url,
      originalUrl: url,
      isPlatformLink: false,
      hint: '音频直链，可直接播放',
    };
  }

  // 3. 检查是否为已知平台
  for (const rule of PLATFORM_RULES) {
    if (rule.pattern.test(url)) {
      const embedUrl = rule.convert(url);
      if (embedUrl) {
        return {
          playType: 'embed',
          playUrl: embedUrl,
          originalUrl: url,
          platform: rule.name,
          isPlatformLink: true,
          hint: `${rule.name}链接，已自动转换为嵌入播放器`,
        };
      }
      return {
        playType: 'audio',
        playUrl: url,
        originalUrl: url,
        platform: rule.name,
        isPlatformLink: true,
        hint: `${rule.name}链接，暂不支持自动嵌入。请使用音频直链或网易云外链`,
      };
    }
  }

  // 4. 如果URL包含iframe/embed相关关键词，视为嵌入URL
  if (/embed|outchain|player\.html|iframe/i.test(url)) {
    return {
      playType: 'embed',
      playUrl: url,
      originalUrl: url,
      isPlatformLink: false,
      hint: '检测为嵌入播放器链接',
    };
  }

  // 5. 默认尝试作为音频直链播放
  return {
    playType: 'audio',
    playUrl: url,
    originalUrl: url,
    isPlatformLink: false,
    hint: '非标准音频格式，建议先试听确认',
  };
}

/** 获取直链的提示文本 */
export function getDirectLinkHint(url: string): { type: 'success' | 'warning' | 'error' | 'info'; text: string } | null {
  if (!url) return null;

  const info = analyzeMusicUrl(url);

  if (info.hint?.includes('格式无效')) {
    return { type: 'error', text: info.hint };
  }
  if (info.playType === 'audio' && !info.isPlatformLink) {
    if (info.hint?.includes('直链')) return { type: 'success', text: info.hint };
    return { type: 'info', text: info.hint || '非标准音频格式，建议先试听确认' };
  }
  if (info.playType === 'embed') {
    return { type: 'success', text: info.hint || '将使用嵌入播放器播放' };
  }
  if (info.isPlatformLink) {
    return { type: 'warning', text: info.hint || '平台链接，建议使用直链或网易云外链' };
  }
  return { type: 'info', text: info.hint || '' };
}
