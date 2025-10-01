/**
 * 韩剧TV搜索模块
 * 基于 danmu_v1.2.0.js 中的真实实现
 */


import useLogger from '../../composables/useLogger';
import { httpGet } from '../request-client';

const logger = useLogger();

/**
 * 韩剧TV搜索结果类型（严格对齐原始 JS 返回结构）
 */
export interface HanjutvSearchResult {
  animeId: number;
  sid: string;
  name: string;
  updateTime: string | number;
  image: { thumb: string };
  category?: number | string;
  rank?: number;
}

/**
 * 韩剧TV系列信息
 */
export interface HanjutvSeries {
  sid: string;
  name: string;
  description?: string;
  category?: number | string;
  rank?: number;
  [key: string]: any;
}

/**
 * 韩剧TV剧集信息
 */
export interface HanjutvEpisode {
  serialNo: number;
  title: string;
  pid: string;
  [key: string]: any;
}

/**
 * 将字符串转换为ASCII码和
 * 用于生成唯一的动画ID
 */
function convertToAsciiSum(sid: string): number {
  let hash = 5381;
  for (let i = 0; i < sid.length; i++) {
    hash = (hash * 33) ^ sid.charCodeAt(i);
  }
  return hash >>> 0;
}

/**
 * 搜索韩剧TV
 * @param keyword 搜索关键词
 * @returns 搜索结果列表
 */
export async function hanjutvSearch(keyword: string): Promise<HanjutvSearchResult[]> {
  try {
    const resp = await httpGet(`https://hxqapi.hiyun.tv/wapi/search/aggregate/search?keyword=${encodeURIComponent(keyword)}&scope=101&page=1`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // 判断 resp 和 resp.data 是否存在
    if (!resp || !resp.data) {
      logger.warn('hanjutvSearch: 请求失败或无数据返回');
      return [];
    }

    // 判断 seriesData 是否存在
    if (!resp.data.seriesData || !resp.data.seriesData.seriesList) {
      logger.warn('hanjutvSearch: seriesData 或 seriesList 不存在');
      return [];
    }

    logger.info(`hanjutvSearch: 找到 ${resp.data.seriesData.seriesList.length} 个结果`);

    const resList: HanjutvSearchResult[] = [];
    for (const anime of resp.data.seriesData.seriesList) {
      const animeId = convertToAsciiSum(anime.sid);
      // 严格只保留需要的字段
      resList.push({
        animeId,
        sid: anime.sid,
        name: anime.name,
        updateTime: anime.updateTime,
        image: { thumb: anime.cover || anime.image?.thumb || '' },
        category: anime.category,
        rank: anime.rank
      });
    }
    return resList;
  } catch (error) {
    logger.error('hanjutvSearch error:', error);
    return [];
  }
}

/**
 * 获取韩剧TV系列详情
 * @param sid 系列ID
 * @returns 系列详情
 */
export async function getHanjutvDetail(sid: string): Promise<HanjutvSeries | null> {
  try {
    const resp = await httpGet(`https://hxqapi.hiyun.tv/wapi/series/series/detail?sid=${sid}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // 判断 resp 和 resp.data 是否存在
    if (!resp || !resp.data) {
      logger.warn('getHanjutvDetail: 请求失败或无数据返回');
      return null;
    }

    // 判断 series 是否存在
    if (!resp.data.series) {
      logger.warn('getHanjutvDetail: series 不存在');
      return null;
    }

    logger.info(`getHanjutvDetail: 成功获取系列详情 ${sid}`);
    return resp.data.series;
  } catch (error) {
    logger.error('getHanjutvDetail error:', error);
    return null;
  }
}

/**
 * 获取韩剧TV剧集列表
 * @param sid 系列ID
 * @returns 剧集列表
 */
export async function getHanjutvEpisodes(sid: string): Promise<HanjutvEpisode[]> {
  try {
    const resp = await httpGet(`https://hxqapi.hiyun.tv/wapi/series/series/detail?sid=${sid}`, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    // 判断 resp 和 resp.data 是否存在
    if (!resp || !resp.data) {
      logger.warn('getHanjutvEpisodes: 请求失败或无数据返回');
      return [];
    }

    // 判断 episodes 是否存在
    if (!resp.data.episodes) {
      logger.warn('getHanjutvEpisodes: episodes 不存在');
      return [];
    }

    const sortedEpisodes = resp.data.episodes.sort((a: HanjutvEpisode, b: HanjutvEpisode) => a.serialNo - b.serialNo);

    logger.info(`getHanjutvEpisodes: 找到 ${sortedEpisodes.length} 个剧集`);
    return sortedEpisodes;
  } catch (error) {
    logger.error('getHanjutvEpisodes error:', error);
    return [];
  }
}
