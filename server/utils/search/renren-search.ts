/**
 * 人人视频搜索模块
 * 提供人人视频平台的动画信息搜索功能
 * 基于原始 danmu.js 的 renrenSearch 逻辑
 */

import { httpGet } from '../request-client';
import useLogger from '~~/server/composables/useLogger';
import { CryptoUtils } from '../crypto-utils';

const logger = useLogger();


export interface RenrenDrama {
  id: number;
  title: string;
  cover: string;
  year: number;
  episodeTotal: number;
  season?: number;
  description?: string;
  score?: number;
}

/**
 * 搜索锁和节流配置
 */
export interface SearchThrottleConfig {
  lockRef?: { value: boolean };
  lastRequestTimeRef?: { value: number };
  minInterval?: number;
}

/**
 * 人人视频请求签名配置
 */
export interface RenrenRequestConfig {
  method: 'GET' | 'POST';
  url: string;
  params: Record<string, any>;
  deviceId: string;
}

/**
 * 生成设备ID
 */
export function generateDeviceId(): string {
  return (Math.random().toString(36).slice(2)).toUpperCase();
}

/**
 * 构建排序后的查询字符串
 */
export function sortedQueryString(params: Record<string, any>): string {
  const normalized: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === "boolean") normalized[k] = v ? "true" : "false";
    else if (v == null) normalized[k] = "";
    else normalized[k] = String(v);
  }

  const keys = Object.keys(normalized).sort();
  const pairs = keys.map(key =>
    `${encodeURIComponent(key)}=${encodeURIComponent(normalized[key])}`
  );

  return pairs.join('&');
}

/**
 * 获取URL路径名
 */
export function getPathname(url: string): string {
  let pathnameStart = url.indexOf('//') + 2;
  if (pathnameStart === 1) pathnameStart = 0;
  const pathStart = url.indexOf('/', pathnameStart);
  if (pathStart === -1) return '/';
  const queryStart = url.indexOf('?', pathStart);
  const hashStart = url.indexOf('#', pathStart);
  let pathEnd = queryStart !== -1 ? queryStart : (hashStart !== -1 ? hashStart : url.length);
  const pathname = url.substring(pathStart, pathEnd);
  return pathname || '/';
}

/**
 * 生成签名
 */
export function generateSignature(method: string, aliId: string, ct: string, cv: string, timestamp: number, path: string, sortedQuery: string, secret: string): string {
  const signStr = `${method.toUpperCase()}\naliId:${aliId}\nct:${ct}\ncv:${cv}\nt:${timestamp}\n${path}?${sortedQuery}`;
  return CryptoUtils.hmacSha256(signStr, secret);
}

/**
 * 构建签名头
 */
export function buildSignedHeaders(config: RenrenRequestConfig): Record<string, string> {
  const ClientProfile = {
    client_type: "web_pc",
    client_version: "1.0.0",
    user_agent: "Mozilla/5.0",
    origin: "https://rrsp.com.cn",
    referer: "https://rrsp.com.cn/",
  };

  const pathname = getPathname(config.url);
  const qs = sortedQueryString(config.params);
  const nowMs = Date.now();
  const SIGN_SECRET = "ES513W0B1CsdUrR13Qk5EgDAKPeeKZY";
  const xCaSign = generateSignature(
    config.method, config.deviceId, ClientProfile.client_type, ClientProfile.client_version,
    nowMs, pathname, qs, SIGN_SECRET
  );

  return {
    clientVersion: ClientProfile.client_version,
    deviceId: config.deviceId,
    clientType: ClientProfile.client_type,
    t: String(nowMs),
    aliId: config.deviceId,
    umid: config.deviceId,
    token: "",
    cv: ClientProfile.client_version,
    ct: ClientProfile.client_type,
    uet: "9",
    "x-ca-sign": xCaSign,
    Accept: "application/json",
    "User-Agent": ClientProfile.user_agent,
    Origin: ClientProfile.origin,
    Referer: ClientProfile.referer,
  };
}

/**
 * 人人视频搜索（基于原始 danmu.js 的 renrenSearch 逻辑）
 */
export async function searchRenrenAnimes(
  keyword: string,
  episodeInfo: EpisodeInfo | null = null,
  _options: SearchOptions = {}
): Promise<AnimeSearchResult[]> {
  try {
    logger.info(`开始搜索人人视频: ${keyword}`);

    // 解析关键词（简化版本，原始代码有更复杂的解析逻辑）
    const parsedKeyword = { title: keyword, season: null };
    const searchTitle = parsedKeyword.title;
    const searchSeason = parsedKeyword.season;

    const lock = { value: false };
    const lastRequestTime = { value: 0 };
    let allResults = await performNetworkSearch(searchTitle, episodeInfo, {
      lockRef: lock,
      lastRequestTimeRef: lastRequestTime,
      minInterval: 400
    });

    if (searchSeason == null) {
      logger.info(`人人视频搜索结果数量: ${allResults.length}`);
      return allResults;
    }

    // 按 season 过滤
    const filteredResults = allResults.filter(r => r.season === searchSeason);
    logger.info(`人人视频搜索结果数量（过滤后）: ${filteredResults.length}`);
    return filteredResults;

  } catch (error) {
    logger.error(`人人视频搜索失败: ${error}`);
    return [];
  }
}

/**
 * 执行网络搜索（带节流和锁机制，完全基于原始 danmu.js 逻辑）
 */
async function performNetworkSearch(
  keyword: string,
  episodeInfo: EpisodeInfo | null = null,
  config: SearchThrottleConfig = {}
): Promise<AnimeSearchResult[]> {
  const {
    lockRef = null,
    lastRequestTimeRef = { value: 0 },
    minInterval = 500
  } = config;

  const url = 'https://api.rrmj.plus/m-station/search/drama';
  const params = {
    keywords: keyword,
    size: 20,
    order: "match",
    search_after: "",
    isExecuteVipActivity: true
  };

  // 🔒 锁逻辑（可选）
  if (lockRef) {
    while (lockRef.value) await new Promise(r => setTimeout(r, 50));
    lockRef.value = true;
  }

  // ⏱️ 节流逻辑（依赖 lastRequestTimeRef）
  const now = Date.now();
  const dt = now - lastRequestTimeRef.value;
  if (dt < minInterval) await new Promise(r => setTimeout(r, minInterval - dt));

  const resp = await renrenRequest("GET", url, params);
  lastRequestTimeRef.value = Date.now(); // 更新引用

  if (lockRef) lockRef.value = false;

  if (!resp.data) return [];

  const decoded = CryptoUtils.autoDecode(resp.data, '3b744389882a4067');
  const list = decoded?.data?.searchDramaList || [];

  return list.map((item: RenrenDrama) => ({
    provider: "renren",
    animeId: item.id,
    bangumiId: String(item.id),
    animeTitle: String(item.title || "").replace(/<[^>]+>/g, "").replace(/:/g, "："),
    type: "tv_series",
    typeDescription: "TV Series",
    imageUrl: item.cover,
    startDate: `${item.year}-01-01T00:00:00`,
    episodeCount: item.episodeTotal || 0,
    rating: item.score || 0,
    isFavorited: false,
    year: String(item.year),
    season: item.season || null,
    description: item.description,
    currentEpisodeIndex: episodeInfo?.episode ?? null,
    playlinks: [] // 人人视频的播放链接需要单独获取
  }));
}

/**
 * 人人视频请求封装（基于原始 danmu.js 的 renrenRequest 逻辑）
 */
async function renrenRequest(method: 'GET' | 'POST', url: string, params: Record<string, any>) {
  const deviceId = generateDeviceId();
  const headers = buildSignedHeaders({ method, url, params, deviceId });
  const resp = await httpGet(url + "?" + sortedQueryString(params), {
    headers: headers,
  });
  return resp;
}

/**
 * 从人人视频URL中提取信息
 */
export async function getInfoFromRenrenUrl(url: string): Promise<{ mediaId: string; episodeId?: string } | null> {
  try {
    const match = String(url).match(/\/v\/(\d+)/);
    if (!match) {
      logger.warn(`无法从人人视频URL中提取ID: ${url}`);
      return null;
    }

    const mediaId = match[1];
    logger.info(`从人人视频URL提取到媒体ID: ${mediaId}`);

    // 可以进一步从URL中提取集数信息
    const episodeMatch = url.match(/episode[/_](\d+)/i);
    const episodeId = episodeMatch ? episodeMatch[1] : undefined;

    return { mediaId, episodeId };
  } catch (error) {
    logger.error(`解析人人视频URL失败: ${error}`);
    return null;
  }
}

/**
 * 根据季度过滤搜索结果
 */
export function filterBySeasonRenren(results: AnimeSearchResult[], searchSeason?: number): AnimeSearchResult[] {
  if (!searchSeason) return results;

  return results.filter(result => {
    if (result.season === searchSeason) return true;

    // 如果没有明确的season字段，尝试从标题中判断
    const title = result.animeTitle.toLowerCase();
    if (title.includes(`第${searchSeason}季`) ||
      title.includes(`season ${searchSeason}`) ||
      title.includes(`s${searchSeason}`)) {
      return true;
    }

    return false;
  });
}

/**
 * 获取人人视频剧集详情
 */
export async function getRenrenDramaDetails(dramaId: string): Promise<any> {
  try {
    logger.info(`获取人人视频剧集详情: ${dramaId}`);

    const url = 'https://api.rrmj.plus/m-station/drama/detail';
    const params = { dramaId };

    const response = await renrenRequest('GET', url, params);

    if (!response.data) {
      throw new Error('获取剧集详情失败：响应为空');
    }

    return CryptoUtils.autoDecode(response.data, '3b744389882a4067');
  } catch (error) {
    logger.error(`获取人人视频剧集详情失败: ${error}`);
    throw error;
  }
}
