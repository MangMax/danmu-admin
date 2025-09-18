/**
 * 缓存相关的类型定义
 */

/**
 * 缓存条目
 */
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

/**
 * 缓存统计信息
 */
export interface CacheStats {
  totalKeys: number;
  searchKeys: number;
  animeKeys: number;
  episodeKeys: number;
  logKeys: number;
  hitRate?: number;
  missRate?: number;
  averageResponseTime?: number;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  ttl: {
    search: number;
    anime: number;
    episode: number;
    logs: number;
  };
  maxSize: {
    search: number;
    anime: number;
    episode: number;
    logs: number;
  };
  driver: 'memory' | 'redis' | 'fs';
  cleanupInterval: number;
}

/**
 * 缓存操作结果
 */
export interface CacheOperationResult {
  success: boolean;
  key: string;
  operation: 'get' | 'set' | 'remove' | 'clear';
  timestamp: number;
  error?: string;
}

/**
 * 缓存清理选项
 */
export interface CacheCleanupOptions {
  pattern?: string;
  olderThan?: number; // 毫秒
  maxKeys?: number;
  dryRun?: boolean;
}
