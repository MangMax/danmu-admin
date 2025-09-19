/**
 * API 相关的类型定义
 * 基于原始 danmu.js 的实际响应格式
 */

/**
 * 通用 API 响应格式（基于原始 danmu.js）
 */
export interface ApiResponse<T = any> {
  errorCode: number;
  success: boolean;
  errorMessage: string;
  data?: T;
}

/**
 * 搜索动漫响应
 */
export interface SearchAnimeResponse {
  errorCode: number;
  success: boolean;
  errorMessage: string;
  animes: AnimeSearchResult[];
}

// 导入需要的类型
import type { AnimeSearchResult } from './search';
import type { DanmakuJson } from './danmuku';

/**
 * 弹幕响应（特殊格式，不使用通用 ApiResponse）
 */
export interface CommentResponse {
  count: number;
  comments: DanmakuJson[];
}

/**
 * 匹配响应
 */
export interface MatchResponse {
  errorCode: number;
  success: boolean;
  errorMessage: string;
  isMatched: boolean;
  matches: MatchResult[];
}

/**
 * 匹配结果
 */
export interface MatchResult {
  episodeId: number;
  animeId: number;
  animeTitle: string;
  episodeTitle: string;
  type: string;
  typeDescription: string;
  shift: number;
  imageUrl: string;
}

/**
 * 番剧详情响应
 */
export interface BangumiResponse {
  errorCode: number;
  success: boolean;
  errorMessage: string;
  bangumi: BangumiDetail;
}

/**
 * 番剧详情
 */
export interface BangumiDetail {
  animeId: number;
  bangumiId: string;
  animeTitle: string;
  imageUrl: string;
  isOnAir: boolean;
  airDay: number;
  isFavorited: boolean;
  rating: number;
  type: string;
  typeDescription: string;
  seasons: Season[];
  episodes: Episode[];
}

/**
 * 季度信息
 */
export interface Season {
  id: string;
  airDate: string;
  name: string;
  episodeCount: number;
}

/**
 * 集数信息
 */
export interface Episode {
  seasonId: string;
  episodeId: number;
  episodeTitle: string;
  episodeNumber: string;
  airDate: string;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * 错误响应
 */
export interface ErrorResponse extends ApiResponse<null> {
  success: false;
  errorCode: number;
  errorMessage: string;
}

/**
 * 请求参数基类
 */
export interface BaseRequest {
  requestId?: string;
  timestamp?: number;
}

/**
 * 搜索动漫请求参数（基于原始 danmu.js）
 */
export interface SearchAnimeRequestParams extends BaseRequest {
  keyword: string;
}

/**
 * 搜索集数请求参数
 */
export interface SearchEpisodesRequestParams extends BaseRequest {
  anime: string;
  episode?: string;
}

/**
 * 弹幕请求参数
 */
export interface CommentRequestParams extends BaseRequest {
  commentId: number;
}

/**
 * 匹配请求参数（基于原始 danmu.js）
 */
export interface MatchRequestParams extends BaseRequest {
  fileName: string;
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services: {
    search: 'up' | 'down';
    comment: 'up' | 'down';
    cache: 'up' | 'down';
    storage: 'up' | 'down';
  };
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
}
