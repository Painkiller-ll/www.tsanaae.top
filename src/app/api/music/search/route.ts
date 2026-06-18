import { NextRequest, NextResponse } from 'next/server';

// 音乐搜索 API - 三平台搜索(网易云+酷狗+QQ音乐)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const platform = searchParams.get('platform') || 'all'; // all/netease/kugou/qq

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
      duration: number;
      type: 'embed' | 'direct';
      platform: string;
      isFree: boolean;
    }> = [];

    const promises: Promise<void>[] = [];

    // 网易云音乐搜索
    if (platform === 'all' || platform === 'netease') {
      promises.push(
        searchNetease(keyword).then((r) => { results.push(...r); })
      );
    }

    // 酷狗音乐搜索
    if (platform === 'all' || platform === 'kugou') {
      promises.push(
        searchKugou(keyword).then((r) => { results.push(...r); })
      );
    }

    // QQ音乐搜索
    if (platform === 'all' || platform === 'qq') {
      promises.push(
        searchQQ(keyword).then((r) => { results.push(...r); })
      );
    }

    await Promise.allSettled(promises);

    // 按平台分组排序: 酷狗(可能有直链) > 网易云 > QQ
    const platformOrder: Record<string, number> = { kugou: 0, netease: 1, qq: 2 };
    results.sort((a, b) => (platformOrder[a.platform] ?? 9) - (platformOrder[b.platform] ?? 9));

    // 去重(按歌名+歌手, 优先保留有直链的版本)
    const seen = new Map<string, typeof results[0]>();
    for (const r of results) {
      const key = `${r.title}-${r.artist}`.toLowerCase().replace(/\s/g, '');
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, r);
      } else if (r.type === 'direct' && existing.type === 'embed') {
        // 优先保留直链版本
        seen.set(key, r);
      }
    }

    const unique = Array.from(seen.values());
    return NextResponse.json({ results: unique, total: unique.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : '搜索失败';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 网易云音乐搜索 - 使用外链播放器
async function searchNetease(keyword: string) {
  const results: Array<{
    id: string; title: string; artist: string; album: string;
    cover: string; url: string; duration: number;
    type: 'embed' | 'direct'; platform: string; isFree: boolean;
  }> = [];

  try {
    const searchUrl = `https://music.163.com/api/search/get/web?s=${encodeURIComponent(keyword)}&type=1&offset=0&limit=30`;
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://music.163.com/',
      },
    });
    const text = await resp.text();
    let data: Record<string, unknown>;
    try { data = JSON.parse(text); } catch { return results; }

    const songs = (data?.result as Record<string, unknown>)?.songs as Array<Record<string, unknown>> | undefined;
    if (!songs || !Array.isArray(songs)) return results;

    for (const song of songs) {
      const artists = (song.artists as Array<Record<string, string>>)?.map((a) => a.name).join('/') || '';
      const albumName = (song.album as Record<string, string>)?.name || '';
      const coverUrl = (song.album as Record<string, string>)?.picUrl || '';
      const songId = song.id as number;
      const duration = Math.round(((song.duration as number) || 0) / 1000);
      const fee = song.fee as number;
      const isFree = fee === 0 || fee === 8;

      const embedUrl = `https://music.163.com/outchain/player?type=2&id=${songId}&auto=0&height=66`;

      results.push({
        id: `netease_${songId}`,
        title: (song.name as string) || '',
        artist: artists,
        album: albumName,
        cover: coverUrl,
        url: embedUrl,
        duration,
        type: 'embed',
        platform: 'netease',
        isFree,
      });
    }
  } catch (err) {
    console.error('[music search] netease error:', err);
  }

  return results;
}

// 酷狗音乐搜索 - 可获取免费歌曲直链
async function searchKugou(keyword: string) {
  const results: Array<{
    id: string; title: string; artist: string; album: string;
    cover: string; url: string; duration: number;
    type: 'embed' | 'direct'; platform: string; isFree: boolean;
  }> = [];

  try {
    const searchUrl = `http://mobilecdn.kugou.com/api/v3/search/song?keyword=${encodeURIComponent(keyword)}&page=1&pagesize=30`;
    const resp = await fetch(searchUrl);
    const data = await resp.json() as Record<string, unknown>;
    const info = (data?.data as Record<string, unknown>)?.info as Array<Record<string, unknown>> | undefined;
    if (!info || !Array.isArray(info)) return results;

    for (const song of info) {
      const songName = (song.songname as string) || '';
      const artistName = (song.singername as string) || '';
      const albumName = (song.album_name as string) || '';
      const hash = (song.hash as string) || '';
      const duration = (song.duration as number) || 0;
      const feeType = song.feetype as number;
      const payType = song.pay_type as number;
      const isFree = feeType === 0 && payType === 0;

      const embedUrl = `https://www.kugou.com/song/#hash=${hash}`;

      results.push({
        id: `kugou_${hash}`,
        title: songName,
        artist: artistName,
        album: albumName,
        cover: '',
        url: embedUrl,
        duration,
        type: 'embed',
        platform: 'kugou',
        isFree,
      });
    }

    // 对免费歌曲尝试获取直链
    const freeSongs = results.filter((r) => r.isFree);
    const urlPromises = freeSongs.map(async (song) => {
      try {
        const hash = song.id.replace('kugou_', '');
        const infoUrl = `http://m.kugou.com/app/i/getSongInfo.php?hash=${hash}&cmd=playInfo&mid=${Date.now()}&dfid=${Date.now()}`;
        const resp = await fetch(infoUrl);
        const data = await resp.json() as Record<string, unknown>;
        const playUrl = data.url as string;
        if (playUrl && playUrl.startsWith('http')) {
          song.url = playUrl;
          song.type = 'direct';
        }
        const imgUrl = data.imgUrl as string;
        if (imgUrl) {
          song.cover = imgUrl.replace('{size}', '150');
        }
      } catch {
        // 忽略单个歌曲获取失败
      }
    });

    await Promise.allSettled(urlPromises);
  } catch (err) {
    console.error('[music search] kugou error:', err);
  }

  return results;
}

// QQ音乐搜索 - 使用嵌入播放器
async function searchQQ(keyword: string) {
  const results: Array<{
    id: string; title: string; artist: string; album: string;
    cover: string; url: string; duration: number;
    type: 'embed' | 'direct'; platform: string; isFree: boolean;
  }> = [];

  try {
    const searchUrl = `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=${encodeURIComponent(keyword)}&format=json&p=1&n=30`;
    const resp = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://y.qq.com/',
      },
    });
    const text = await resp.text();
    let data: Record<string, unknown>;
    try { data = JSON.parse(text); } catch { return results; }

    const songList = ((data?.data as Record<string, unknown>)?.song as Record<string, unknown>)?.list as Array<Record<string, unknown>> | undefined;
    if (!songList || !Array.isArray(songList)) return results;

    for (const song of songList) {
      const songName = (song.songname as string) || '';
      const singers = (song.singer as Array<Record<string, string>>)?.map((s) => s.name).join('/') || '';
      const albumName = (song.albumname as string) || '';
      const songMid = (song.songmid as string) || '';
      const albumMid = (song.albummid as string) || '';
      const interval = (song.interval as number) || 0;
      const payInfo = song.pay as Record<string, number> | undefined;
      const isFree = payInfo ? payInfo.payplay === 0 : true;

      const coverUrl = albumMid
        ? `https://y.gtimg.cn/music/photo_new/T002R150x150M000${albumMid}.jpg`
        : '';

      // QQ音乐歌曲页面链接（嵌入播放用）
      const pageUrl = `https://y.qq.com/n/ryqq/songDetail/${songMid}`;

      results.push({
        id: `qq_${songMid}`,
        title: songName,
        artist: singers,
        album: albumName,
        cover: coverUrl,
        url: pageUrl,
        duration: interval,
        type: 'embed',
        platform: 'qq',
        isFree,
      });
    }

    // 对免费歌曲尝试获取直链
    const freeSongs = results.filter((r) => r.isFree);
    const urlPromises = freeSongs.map(async (song) => {
      try {
        const songMid = song.id.replace('qq_', '');
        const detailUrl = `https://shc.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=${songMid}&platform=yqq&format=json`;
        const resp = await fetch(detailUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://y.qq.com/',
          },
        });
        const data = await resp.json() as Record<string, unknown>;
        const songs = data.data as Array<Record<string, unknown>> | undefined;
        if (songs && songs.length > 0) {
          const file = songs[0].file as Record<string, unknown> | undefined;
          if (file) {
            const mediaMid = (file.media_mid as string) || songMid;
            const filename = `M500${mediaMid}.mp3`;
            const vkeyUrl = `https://u.y.qq.com/cgi-bin/musicu.fcg?data=${encodeURIComponent(JSON.stringify({
              comm: { ct: 19, cv: '1859', uin: '0' },
              req_0: {
                method: 'CgiGetVkeyServer',
                module: 'vkey.GetVkeyServer',
                param: {
                  filename: [filename],
                  guid: '100000',
                  loginflag: 1,
                  platform: '20',
                  songmid: [songMid],
                  songtype: [0],
                  uin: '0',
                },
              },
            }))}`;
            const vkeyResp = await fetch(vkeyUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://y.qq.com/',
                'Origin': 'https://y.qq.com',
              },
            });
            const vkeyData = await vkeyResp.json() as Record<string, unknown>;
            const req0 = vkeyData.req_0 as Record<string, unknown> | undefined;
            if (req0 && req0.code === 0) {
              const vkeyInfo = req0.data as Record<string, unknown> | undefined;
              if (vkeyInfo) {
                const sip = vkeyInfo.sip as Array<string> | undefined;
                const midurlinfo = vkeyInfo.midurlinfo as Array<Record<string, string>> | undefined;
                if (sip && sip.length > 0 && midurlinfo && midurlinfo.length > 0 && midurlinfo[0].purl) {
                  const playUrl = `${sip[0]}${midurlinfo[0].purl}`;
                  if (playUrl.startsWith('http')) {
                    song.url = playUrl;
                    song.type = 'direct';
                  }
                }
              }
            }
          }
        }
      } catch {
        // 忽略单个歌曲获取失败，保留embed链接
      }
    });

    await Promise.allSettled(urlPromises);
  } catch (err) {
    console.error('[music search] qq error:', err);
  }

  return results;
}
