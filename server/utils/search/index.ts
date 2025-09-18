/**
 * 搜索模块统一导出
 */

// 主要搜索功能
export { searchAnimes, clearSearchCache, getSearchStats } from './search-router';

// 缓存功能
export { searchCache, animeCache, logCache, cacheManager } from '../storage-cache';

// 匹配功能
export { matchAnimeSeason, parseFileName } from '../match-utils';

// 各平台搜索功能
export { search360Animes, get360Zongyi } from './360kan-search';
export { searchVodAnimes, getVodAnimeDetails, validateVodServer } from './vod-search';
export {
  searchRenrenAnimes,
  getInfoFromRenrenUrl,
  filterBySeasonRenren,
  getRenrenDramaDetails
} from './renren-search';

// 类型定义
export type {
  SearchProvider,
  PlayLink,
  AnimeSearchResult,
  EpisodeInfo,
  SearchOptions,
  SearchRequest,
  SearchResponse,
  SearchStats,
  SearchPlatformConfig
} from '#shared/types';
