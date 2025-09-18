/**
 * 搜索相关的类型定义
 */

/**
 * 搜索提供商
 */
export type SearchProvider = '360kan' | 'vod' | 'renren';

/**
 * 播放链接
 */
export interface PlayLink {
  name: string;
  url: string;
  title: string;
  platform?: string;
  episode?: string;
}

/**
 * 动画搜索结果（基于原始 danmu.js）
 */
export interface AnimeSearchResult {
  provider: SearchProvider;
  animeId: number;
  bangumiId: string;
  animeTitle: string;
  type: string;
  typeDescription: string;
  imageUrl: string;
  startDate: string;
  episodeCount: number;
  rating: number;
  isFavorited: boolean;
  year?: string;
  season?: number | null;
  area?: string;
  description?: string;
  updateInfo?: string;
  currentEpisodeIndex?: number | null;
  playlinks?: PlayLink[];
}

/**
 * 集数信息
 */
export interface EpisodeInfo {
  episode?: number;
  season?: number;
  title?: string;
}

/**
 * 搜索选项
 */
export interface SearchOptions {
  timeout?: number;
  throttleInterval?: number;
  enableCache?: boolean;
}

/**
 * 搜索请求
 */
export interface SearchRequest {
  keyword: string;
  providers?: SearchProvider[];
  maxResults?: number;
  episodeInfo?: EpisodeInfo;
  season?: number;
  options?: SearchOptions;
}

/**
 * 搜索响应
 */
export interface SearchResponse {
  success: boolean;
  data: AnimeSearchResult[];
  total: number;
  keyword: string;
  providers: SearchProvider[];
  cached?: boolean;
  error?: string;
}

/**
 * 搜索统计
 */
export interface SearchStats {
  totalSearches: number;
  cacheHits: number;
  cacheSize: number;
  averageResponseTime?: number;
}

/**
 * 搜索平台配置
 */
export interface SearchPlatformConfig {
  name: SearchProvider;
  enabled: boolean;
  timeout: number;
  priority: number;
  rateLimit?: {
    requests: number;
    window: number; // 时间窗口（毫秒）
  };
}
