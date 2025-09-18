/**
 * 统一类型导出
 * 提供项目中所有类型定义的统一入口
 */

// API 相关类型
export type {
  ApiResponse,
  PaginatedResponse,
  ErrorResponse,
  SearchAnimeResponse,
  CommentResponse,
  MatchResponse,
  MatchResult,
  BangumiResponse,
  BangumiDetail,
  Season,
  Episode,
  BaseRequest,
  SearchAnimeRequestParams,
  SearchEpisodesRequestParams,
  CommentRequestParams,
  MatchRequestParams,
  HealthCheckResponse
} from './api';

// 缓存相关类型
export type {
  CacheEntry,
  CacheStats,
  CacheConfig,
  CacheOperationResult,
  CacheCleanupOptions
} from './cache';

// 弹幕相关类型
export type {
  DanmakuObject,
  DanmakuItem,
  DanmakuContents,
  DanmakuJson,
  BilibiliDanmakuInput,
  DanmakuInputItem,
  DanmakuTypeMap,
  HexToDecimalFunction
} from './danmuku';

// 数据结构类型
export type {
  AnimeData,
  EpisodeLink,
  LogEntry,
  Anime360Result,
  VodAnimeResult,
  RenrenAnimeResult,
  DanmakuContent,
  TencentDanmakuItem,
  IqiyiDanmakuData,
  MangoDanmakuItem,
  BilibiliDanmakuItem,
  YoukuDanmakuItem,
  RenrenDanmakuItem,
  EnvConfig,
  HttpOptions,
  HttpResponse
} from './data';

// 平台相关类型
export type {
  DanmakuPlatform,
  PlatformConfig,
  PlatformMatch,
  PlatformStatus,
  PlatformCapabilities
} from './platform';

// 搜索相关类型
export type {
  SearchProvider,
  PlayLink,
  AnimeSearchResult,
  EpisodeInfo,
  SearchOptions,
  SearchRequest,
  SearchResponse,
  SearchStats
} from './search';

// 重新导出搜索类型中的 SearchPlatformConfig（避免命名冲突）
export type { SearchPlatformConfig } from './search';
