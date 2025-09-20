/**
 * 人人视频搜索模块
 * 提供人人视频平台的动画信息搜索功能
 * 基于原始 danmu.js 的 renrenSearch 逻辑
 */

import { httpGet } from '../request-client';
import useLogger from '~~/server/composables/useLogger';
import { CryptoUtils } from '../crypto-utils';
import type { EpisodeInfo, SearchOptions } from '~~/shared/types/search';

const logger = useLogger();

/**
 * 人人视频剧集信息
 */
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
 * 人人视频剧集详情
 */
export interface RenrenDramaDetail {
  dramaInfo: {
    id: number;
    title: string;
    cover: string;
    year: number;
    description?: string;
    score?: number;
  };
  episodeList?: RenrenEpisode[];
}

/**
 * 人人视频集数信息
 */
export interface RenrenEpisode {
  sid: string;
  title: string;
  order: number;
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
  token?: string;
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
 * 更新URL查询字符串（基于原始 danmu.js 的 updateQueryString 逻辑）
 */
export function updateQueryString(url: string, params: Record<string, any>): string {
  // 解析 URL
  let baseUrl = url;
  let queryString = '';
  const hashIndex = url.indexOf('#');
  let hash = '';

  if (hashIndex !== -1) {
    baseUrl = url.substring(0, hashIndex);
    hash = url.substring(hashIndex);
  }

  const queryIndex = baseUrl.indexOf('?');
  if (queryIndex !== -1) {
    queryString = baseUrl.substring(queryIndex + 1);
    baseUrl = baseUrl.substring(0, queryIndex);
  }

  // 解析现有查询字符串为对象
  const queryParams: Record<string, string> = {};
  if (queryString) {
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      if (pair) {
        const [key, value = ''] = pair.split('=').map(decodeURIComponent);
        queryParams[key] = value;
      }
    }
  }

  // 更新参数
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      queryParams[key] = params[key];
    }
  }

  // 构建新的查询字符串
  const newQuery = [];
  for (const key in queryParams) {
    if (Object.prototype.hasOwnProperty.call(queryParams, key)) {
      newQuery.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`
      );
    }
  }

  // 拼接最终 URL
  return baseUrl + (newQuery.length ? '?' + newQuery.join('&') : '') + hash;
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
  return CryptoUtils.createHmacSha256(secret, signStr);
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
    token: config.token || "",
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
 * 人人视频简化搜索结果接口（与原始 danmu.js 保持一致）
 */
export interface RenrenSearchResult {
  provider: string;
  mediaId: string;
  title: string;
  type: string;
  season: null;
  year: number;
  imageUrl: string;
  episodeCount: number;
  currentEpisodeIndex: number | null;
}

/**
 * 人人视频搜索（基于原始 danmu.js 的 renrenSearch 逻辑）
 */
export async function searchRenrenAnimes(
  keyword: string,
  episodeInfo: EpisodeInfo | null = null,
  _options: SearchOptions = {}
): Promise<RenrenSearchResult[]> {
  try {
    logger.info(`开始搜索人人视频: ${keyword}`);

    // 解析关键词（保持与原始代码一致的简化版本）
    const parsedKeyword = parseSearchKeyword(keyword);
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
 * 解析搜索关键词（基于原始 danmu.js 逻辑的简化版本）
 */
function parseSearchKeyword(keyword: string): { title: string; season: number | null } {
  // 这里可以根据需要实现更复杂的解析逻辑
  // 例如：提取季度信息等
  return { title: keyword, season: null };
}

/**
 * 执行网络搜索（带节流和锁机制，完全基于原始 danmu.js 逻辑）
 */
async function performNetworkSearch(
  keyword: string,
  episodeInfo: EpisodeInfo | null = null,
  config: SearchThrottleConfig = {}
): Promise<RenrenSearchResult[]> {
  try {
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

    if (!resp.data) {
      logger.warn('人人视频搜索响应为空');
      return [];
    }

    const decoded = CryptoUtils.autoDecode(resp.data, '3b744389882a4067');
    const list = decoded?.data?.searchDramaList || [];

    logger.debug('人人视频搜索原始结果:', list);

    // 根据原始 danmu.js 的返回结构，这里应该返回简化的搜索结果
    return list.map((item: RenrenDrama) => ({
      provider: "renren",
      mediaId: String(item.id),
      title: String(item.title || "").replace(/<[^>]+>/g, "").replace(/:/g, "："),
      type: "剧集 - renren",
      season: null,
      year: item.year,
      imageUrl: item.cover,
      episodeCount: item.episodeTotal,
      currentEpisodeIndex: episodeInfo?.episode ?? null,
    }));
  } catch (error) {
    logger.error(`人人视频网络搜索失败: ${error}`);
    return [];
  }
}

/**
 * 人人视频请求封装（基于原始 danmu.js 的 renrenRequest 逻辑）
 */
async function renrenRequest(method: 'GET' | 'POST', url: string, params: Record<string, any>, token?: string) {
  const deviceId = generateDeviceId();
  const headers = buildSignedHeaders({ method, url, params, deviceId, token });
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
export function filterBySeasonRenren(results: RenrenSearchResult[], searchSeason?: number): RenrenSearchResult[] {
  if (!searchSeason) return results;

  return results.filter(result => {
    if (result.season === searchSeason) return true;

    // 如果没有明确的season字段，尝试从标题中判断
    const title = result.title.toLowerCase();
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
export async function fetchDramaDetail(dramaId: string): Promise<RenrenDramaDetail | null> {
  try {
    logger.info(`获取人人视频剧集详情: ${dramaId}`);

    const url = 'https://api.rrmj.plus/m-station/drama/page';
    const params = {
      hsdrOpen: 0,
      isAgeLimit: 0,
      dramaId: String(dramaId),
      hevcOpen: 1
    };

    const resp = await renrenRequest('GET', url, params);

    if (!resp.data) {
      logger.warn(`获取剧集详情失败：响应为空，dramaId: ${dramaId}`);
      return null;
    }

    const decoded = CryptoUtils.autoDecode(resp.data, '3b744389882a4067');
    return decoded?.data || null;
  } catch (error) {
    logger.error(`获取人人视频剧集详情失败: ${error}`);
    return null;
  }
}

/**
 * 获取人人视频集数信息（基于原始 danmu.js 的 getEpisodes 逻辑）
 */
export async function getEpisodes(
  mediaId: string,
  targetEpisodeIndex: number | null = null
): Promise<RenrenEpisode[]> {
  try {
    const detail = await fetchDramaDetail(mediaId);
    if (!detail || !detail.episodeList) {
      logger.warn(`无法获取剧集集数信息: ${mediaId}`);
      return [];
    }

    let episodes: RenrenEpisode[] = [];
    detail.episodeList.forEach((ep: any, idx: number) => {
      const sid = String(ep.sid || "").trim();
      if (!sid) return;
      const title = String(ep.title || `第${String(idx + 1).padStart(2, "0")}集`);
      episodes.push({ sid, order: idx + 1, title });
    });

    if (targetEpisodeIndex) {
      episodes = episodes.filter(e => e.order === targetEpisodeIndex);
    }

    logger.info(`获取到 ${episodes.length} 集剧集信息，mediaId: ${mediaId}`);
    return episodes;
  } catch (error) {
    logger.error(`获取人人视频集数信息失败: ${error}`);
    return [];
  }
}

/**
 * 从人人视频URL中获取信息（基于原始 danmu.js 的 getInfoFromUrl 逻辑）
 */
export async function getInfoFromUrl(url: string): Promise<RenrenSearchResult | null> {
  try {
    const m = String(url).match(/\/v\/(\d+)/);
    if (!m) {
      logger.warn(`无法从人人视频URL中提取ID: ${url}`);
      return null;
    }

    const dramaId = m[1];
    const detail = await fetchDramaDetail(dramaId);
    if (!detail) return null;

    const titleClean = String(detail.dramaInfo.title).replace(/<[^>]+>/g, "").replace(/:/g, "：");

    // 搜索以获取更完整的信息
    const searchResults = await searchRenrenAnimes(titleClean);
    const bestMatch = searchResults.find(r => r.mediaId === dramaId);

    if (bestMatch && !bestMatch.episodeCount) {
      bestMatch.episodeCount = (detail.episodeList?.length || 0);
    }

    if (bestMatch) return bestMatch;

    // 如果搜索没找到匹配，创建基础信息
    return {
      provider: "renren",
      mediaId: dramaId,
      title: titleClean,
      type: "tv_series",
      season: null,
      year: detail.dramaInfo.year || new Date().getFullYear(),
      imageUrl: detail.dramaInfo.cover || "",
      episodeCount: detail.episodeList?.length || 0,
      currentEpisodeIndex: null
    };
  } catch (error) {
    logger.error(`从人人视频URL获取信息失败: ${error}`);
    return null;
  }
}

/**
 * 根据ID获取URL（基于原始 danmu.js 的 getIdFromUrl 逻辑）
 */
export function getIdFromUrl(url: string): string | null {
  const m = String(url).match(/\/v\/\d+\/(\d+)/);
  return m ? m[1] : null;
}

/**
 * 格式化集数ID用于弹幕（基于原始 danmu.js 的 formatEpisodeIdForComments 逻辑）
 */
export function formatEpisodeIdForComments(providerEpisodeId: string): string {
  return String(providerEpisodeId);
}

/**
 * 废弃的旧方法，保持向后兼容
 * @deprecated 使用 fetchDramaDetail 替代
 */
export async function getRenrenDramaDetails(dramaId: string): Promise<any> {
  logger.warn('getRenrenDramaDetails 已废弃，请使用 fetchDramaDetail');
  return fetchDramaDetail(dramaId);
}
