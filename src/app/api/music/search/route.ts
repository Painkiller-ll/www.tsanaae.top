import { NextRequest, NextResponse } from 'next/server';

// 音乐搜索 API - 搜索网易云/酷狗等平台歌曲，返回可播放链接
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const platform = searchParams.get('platform') || 'netease'; // 默认网易云

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({ error: '请输入搜索关键词' }, { status: 400 });
    }

    let results: Array<{
      id: string;
      title: string;
      artist: string;
      album: string;
      cover: string;
      url: string;
      type: 'embed' | 'direct';
      platform: string;
    }> = [];

    if (platform === 'netease') {
      // 网易云音乐搜索 - 使用公开搜索接口
      try {
        const searchUrl = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(keyword)}&type=1&offset=0&limit=20`;
        const resp = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://music.163.com/',
          },
        });
        const text = await resp.text();
        let data: Record<string, unknown>;
        try {
          data = JSON.parse(text);
        } catch {
          return NextResponse.json({ results: [], message: '搜索服务暂时不可用' });
        }

        const songs = (data?.result as Record<string, unknown>)?.songs as Array<Record<string, unknown>> | undefined;
        if (songs && Array.isArray(songs)) {
          results = songs.slice(0, 15).map((song) => {
            const artists = (song.artists as Array<Record<string, string>>)?.map((a) => a.name).join('/') || '';
            const albumName = (song.album as Record<string, string>)?.name || '';
            const coverUrl = (song.album as Record<string, string>)?.picUrl || '';
            const songId = song.id as number;

            // 使用网易云外链播放器 - 免费、无需VIP、稳定可用
            const embedUrl = `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;

            return {
              id: String(songId),
              title: (song.name as string) || '',
              artist: artists,
              album: albumName,
              cover: coverUrl,
              url: embedUrl,
              type: 'embed' as const,
              platform: 'netease',
            };
          });
        }
      } catch (err) {
        console.error('[music search] netease error:', err);
      }
    }

    return NextResponse.json({ results, total: results.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : '搜索失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
