/**
 * 搜索路由器
 * 统一管理多个平台的搜索功能
 */

import useLogger from '~~/server/composables/useLogger';
import { searchCache } from '../storage-cache';
import { utils } from '../string-utils';
import { search360Animes } from './360kan-search';
import { searchVodAnimes } from './vod-search';
import { searchRenrenAnimes } from './renren-search';
import type {
  AnimeSearchResult,
  SearchOptions,
  SearchRequest,
  SearchProvider,
  EpisodeInfo
} from '#shared/types';

const logger = useLogger();

/**
 * 搜索配置
 */
interface SearchConfig {
  providers: SearchProvider[];
  maxResults?: number;
  timeout?: number;
  enableCache?: boolean;
  cacheExpiration?: number; // 缓存过期时间（毫秒）
}

/**
 * 默认搜索配置
 */
const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  providers: ['360kan', 'vod', 'renren'],
  maxResults: 50,
  timeout: 10000,
  enableCache: true,
  cacheExpiration: 30 * 60 * 1000 // 30分钟
};

/**
 * 统一搜索入口
 */
export async function searchAnimes(request: SearchRequest): Promise<AnimeSearchResult[]> {
  const {
    keyword,
    providers = DEFAULT_SEARCH_CONFIG.providers,
    maxResults = DEFAULT_SEARCH_CONFIG.maxResults,
    episodeInfo,
    season,
    options = {}
  } = request;

  if (!keyword || !utils.validation.isValidLength(keyword, 1, 100)) {
    throw new Error('搜索关键词无效');
  }

  logger.info(`开始搜索动画: ${keyword}, 提供商: ${providers.join(', ')}`);

  // 检查缓存
  if (options.enableCache !== false) {
    const cachedResult = await searchCache.getSearchResults(keyword, providers, season);
    if (cachedResult) {
      logger.info(`使用缓存的搜索结果: ${keyword}`);
      return cachedResult.slice(0, maxResults);
    }
  }

  const searchOptions: SearchOptions = {
    timeout: options.timeout || DEFAULT_SEARCH_CONFIG.timeout,
    throttleInterval: options.throttleInterval
  };

  // 并行搜索所有提供商
  const searchPromises = providers.map(provider =>
    searchFromProvider(provider, keyword, episodeInfo, searchOptions)
  );

  try {
    const searchResults = await Promise.allSettled(searchPromises);
    const allResults: AnimeSearchResult[] = [];

    // 收集所有成功的搜索结果
    searchResults.forEach((result, index) => {
      const provider = providers[index];
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
        logger.info(`${provider} 搜索成功: ${result.value.length} 个结果`);
      } else {
        logger.warn(`${provider} 搜索失败: ${result.reason}`);
      }
    });

    // 过滤和排序结果
    let filteredResults = filterSearchResults(allResults, keyword, season);
    filteredResults = sortSearchResults(filteredResults, keyword);
    filteredResults = filteredResults.slice(0, maxResults);

    // 缓存结果
    if (options.enableCache !== false && filteredResults.length > 0) {
      await searchCache.setSearchResults(keyword, providers, filteredResults, season);
    }

    logger.info(`搜索完成: ${keyword}, 总结果数: ${filteredResults.length}`);
    return filteredResults;

  } catch (error) {
    logger.error(`搜索失败: ${keyword} - ${error}`);
    throw error;
  }
}

/**
 * 从特定提供商搜索
 */
async function searchFromProvider(
  provider: SearchProvider,
  keyword: string,
  episodeInfo?: EpisodeInfo,
  options: SearchOptions = {}
): Promise<AnimeSearchResult[]> {
  switch (provider) {
    case '360kan':
      return await search360Animes(keyword, options);

    case 'vod':
      return await searchVodAnimes(keyword, options);

    case 'renren':
      return await searchRenrenAnimes(keyword, episodeInfo, options);

    default:
      logger.warn(`未知的搜索提供商: ${provider}`);
      return [];
  }
}

/**
 * 过滤搜索结果
 */
function filterSearchResults(
  results: AnimeSearchResult[],
  keyword: string,
  season?: number
): AnimeSearchResult[] {
  let filtered = results;

  // 去重（基于 provider + animeId）
  const uniqueMap = new Map<string, AnimeSearchResult>();
  filtered.forEach(result => {
    const key = `${result.provider}-${result.animeId}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, result);
    }
  });
  filtered = Array.from(uniqueMap.values());

  // 季度过滤
  if (season) {
    filtered = filtered.filter(result => {
      if (result.season === season) return true;

      const title = result.animeTitle.toLowerCase();
      const keywordLower = keyword.toLowerCase();

      // 如果关键词包含季度信息，则严格匹配
      if (keywordLower.includes(`第${season}季`) ||
        keywordLower.includes(`season ${season}`) ||
        keywordLower.includes(`s${season}`)) {
        return title.includes(`第${season}季`) ||
          title.includes(`season ${season}`) ||
          title.includes(`s${season}`);
      }

      return true;
    });
  }

  // 基本质量过滤
  filtered = filtered.filter(result => {
    return result.animeTitle &&
      result.animeTitle.trim().length > 0 &&
      result.episodeCount >= 0;
  });

  return filtered;
}

/**
 * 排序搜索结果
 */
function sortSearchResults(results: AnimeSearchResult[], keyword: string): AnimeSearchResult[] {
  const keywordLower = keyword.toLowerCase();

  return results.sort((a, b) => {
    const aTitle = a.animeTitle.toLowerCase();
    const bTitle = b.animeTitle.toLowerCase();

    // 完全匹配优先
    const aExactMatch = aTitle === keywordLower;
    const bExactMatch = bTitle === keywordLower;
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;

    // 开头匹配优先
    const aStartsWith = aTitle.startsWith(keywordLower);
    const bStartsWith = bTitle.startsWith(keywordLower);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;

    // 评分排序
    if (a.rating !== b.rating) {
      return (b.rating || 0) - (a.rating || 0);
    }

    // 年份排序（新的优先）
    const aYear = parseInt(a.year || '0');
    const bYear = parseInt(b.year || '0');
    if (aYear !== bYear) {
      return bYear - aYear;
    }

    // 集数排序（多的优先）
    return (b.episodeCount || 0) - (a.episodeCount || 0);
  });
}

/**
 * 生成缓存键 - 暂时未使用
 */
// function generateCacheKey(keyword: string, providers: SearchProvider[], season?: number): string {
//   const parts = [
//     'search',
//     keyword.toLowerCase(),
//     providers.sort().join('-'),
//     season ? `s${season}` : 'all'
//   ];
//   return parts.join(':');
// }

/**
 * 清理搜索缓存
 */
export async function clearSearchCache(keyword?: string): Promise<void> {
  await searchCache.clearSearchCache(keyword);
}

/**
 * 获取搜索统计信息
 */
export async function getSearchStats(): Promise<{
  totalSearches: number;
  cacheHits: number;
  cacheSize: number;
}> {
  return await searchCache.getSearchStats();
}
