/**
 * 基于 useStorage 的缓存系统
 * 使用 Nuxt 的 useStorage 提供持久化和分布式缓存支持
 */

import { useStorage } from '#imports';
import useLogger from '~~/server/composables/useLogger';
import type { AnimeSearchResult, SearchProvider } from '#shared/types/search';

const logger = useLogger();

// 缓存配置
export const STORAGE_CONFIG = {
  // 缓存过期时间（秒）
  TTL: {
    SEARCH_RESULTS: 30 * 60, // 30分钟
    ANIME_DETAILS: 2 * 60 * 60, // 2小时  
    EPISODE_INFO: 1 * 60 * 60, // 1小时
    USER_LOGS: 24 * 60 * 60, // 24小时
  },

  // 存储驱动配置
  DRIVERS: {
    REDIS: 'redis', // 生产环境推荐
    MEMORY: 'memory', // 开发环境
    FS: 'fs', // 文件系统存储
  },

  // 存储键前缀
  PREFIXES: {
    SEARCH: 'search:',
    ANIME: 'anime:',
    EPISODE: 'episode:',
    LOGS: 'logs:',
    STATS: 'stats:',
  }
} as const;

/**
 * 缓存条目接口
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
}

/**
 * 搜索缓存管理器
 */
export class SearchCacheManager {
  public storage = useStorage();
  private version = '1.0.2';

  /**
   * 生成缓存键
   */
  private generateKey(type: string, identifier: string): string {
    return `${STORAGE_CONFIG.PREFIXES[type as keyof typeof STORAGE_CONFIG.PREFIXES]}${identifier}`;
  }

  /**
   * 检查缓存是否过期
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return now > (entry.timestamp + entry.ttl * 1000);
  }

  /**
   * 创建缓存条目
   */
  private createCacheEntry<T>(data: T, ttl: number): CacheEntry<T> {
    return {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.version
    };
  }

  /**
   * 获取缓存数据
   */
  async get<T>(type: keyof typeof STORAGE_CONFIG.PREFIXES, key: string): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(type, key);
      const entry = await this.storage.getItem<CacheEntry<T>>(cacheKey);

      if (!entry) {
        return null;
      }

      // 检查版本兼容性
      if (entry.version !== this.version) {
        logger.debug(`Cache version mismatch for ${cacheKey}, removing`);
        await this.storage.removeItem(cacheKey);
        return null;
      }

      // 检查是否过期
      if (this.isExpired(entry)) {
        logger.debug(`Cache expired for ${cacheKey}, removing`);
        await this.storage.removeItem(cacheKey);
        return null;
      }

      logger.debug(`Cache hit for ${cacheKey}`);
      return entry.data;
    } catch (error) {
      logger.error(`Failed to get cache for ${type}:${key}:`, error);
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T>(
    type: keyof typeof STORAGE_CONFIG.PREFIXES,
    key: string,
    data: T,
    ttl?: number
  ): Promise<void> {
    try {
      const cacheKey = this.generateKey(type, key);
      const defaultTtl = STORAGE_CONFIG.TTL[
        type === 'SEARCH' ? 'SEARCH_RESULTS' :
          type === 'ANIME' ? 'ANIME_DETAILS' :
            type === 'EPISODE' ? 'EPISODE_INFO' :
              'USER_LOGS'
      ];

      const entry = this.createCacheEntry(data, ttl || defaultTtl);
      await this.storage.setItem(cacheKey, entry);

      logger.debug(`Cache set for ${cacheKey}, TTL: ${entry.ttl}s`);
    } catch (error) {
      logger.error(`Failed to set cache for ${type}:${key}:`, error);
    }
  }

  /**
   * 删除缓存数据
   */
  async remove(type: keyof typeof STORAGE_CONFIG.PREFIXES, key: string): Promise<void> {
    try {
      const cacheKey = this.generateKey(type, key);
      await this.storage.removeItem(cacheKey);
      logger.debug(`Cache removed for ${cacheKey}`);
    } catch (error) {
      logger.error(`Failed to remove cache for ${type}:${key}:`, error);
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<void> {
    try {
      logger.info('Starting cache cleanup...');

      // 获取所有缓存键
      const keys = await this.storage.getKeys();
      let removedCount = 0;

      for (const key of keys) {
        try {
          const entry = await this.storage.getItem<CacheEntry<any>>(key);
          if (entry && (this.isExpired(entry) || entry.version !== this.version)) {
            await this.storage.removeItem(key);
            removedCount++;
          }
        } catch (error) {
          logger.warn(`Failed to check cache entry ${key}:`, error);
        }
      }

      logger.info(`Cache cleanup completed, removed ${removedCount} expired entries`);
    } catch (error) {
      logger.error('Cache cleanup failed:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<{
    totalKeys: number;
    searchKeys: number;
    animeKeys: number;
    episodeKeys: number;
    logKeys: number;
  }> {
    try {
      const keys = await this.storage.getKeys();

      return {
        totalKeys: keys.length,
        searchKeys: keys.filter((k: string) => k.startsWith(STORAGE_CONFIG.PREFIXES.SEARCH)).length,
        animeKeys: keys.filter((k: string) => k.startsWith(STORAGE_CONFIG.PREFIXES.ANIME)).length,
        episodeKeys: keys.filter((k: string) => k.startsWith(STORAGE_CONFIG.PREFIXES.EPISODE)).length,
        logKeys: keys.filter((k: string) => k.startsWith(STORAGE_CONFIG.PREFIXES.LOGS)).length,
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return {
        totalKeys: 0,
        searchKeys: 0,
        animeKeys: 0,
        episodeKeys: 0,
        logKeys: 0,
      };
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      await this.storage.clear();
      logger.info('All cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }
}

/**
 * 搜索专用缓存方法
 */
export class SearchCache {
  private cacheManager = new SearchCacheManager();

  /**
   * 生成搜索缓存键
   */
  private generateSearchKey(keyword: string, providers: SearchProvider[], season?: number): string {
    const parts = [
      keyword.toLowerCase(),
      providers.sort().join('-'),
      season ? `s${season}` : 'all'
    ];
    return parts.join(':');
  }

  /**
   * 获取搜索结果缓存
   */
  async getSearchResults(
    keyword: string,
    providers: SearchProvider[],
    season?: number
  ): Promise<AnimeSearchResult[] | null> {
    const key = this.generateSearchKey(keyword, providers, season);
    return await this.cacheManager.get<AnimeSearchResult[]>('SEARCH', key);
  }

  /**
   * 设置搜索结果缓存
   */
  async setSearchResults(
    keyword: string,
    providers: SearchProvider[],
    results: AnimeSearchResult[],
    season?: number,
    ttl?: number
  ): Promise<void> {
    const key = this.generateSearchKey(keyword, providers, season);
    await this.cacheManager.set('SEARCH', key, results, ttl);
  }

  /**
   * 清理搜索缓存
   */
  async clearSearchCache(keyword?: string): Promise<void> {
    if (keyword) {
      // 清理特定关键词的缓存 - 需要遍历所有搜索缓存
      try {
        const keys = await this.cacheManager.storage.getKeys();
        const searchKeys = keys.filter((k: string) =>
          k.startsWith(STORAGE_CONFIG.PREFIXES.SEARCH) &&
          k.includes(keyword.toLowerCase())
        );

        for (const key of searchKeys) {
          await this.cacheManager.storage.removeItem(key);
        }

        logger.info(`Cleared search cache for keyword: ${keyword}`);
      } catch (error) {
        logger.error(`Failed to clear search cache for ${keyword}:`, error);
      }
    } else {
      // 清理所有搜索缓存
      try {
        const keys = await this.cacheManager.storage.getKeys();
        const searchKeys = keys.filter((k: string) => k.startsWith(STORAGE_CONFIG.PREFIXES.SEARCH));

        for (const key of searchKeys) {
          await this.cacheManager.storage.removeItem(key);
        }

        logger.info('Cleared all search cache');
      } catch (error) {
        logger.error('Failed to clear all search cache:', error);
      }
    }
  }

  /**
   * 获取搜索缓存统计
   */
  async getSearchStats(): Promise<{
    totalSearches: number;
    cacheHits: number;
    cacheSize: number;
  }> {
    const stats = await this.cacheManager.getStats();
    return {
      totalSearches: stats.searchKeys,
      cacheHits: 0, // 需要单独统计
      cacheSize: stats.searchKeys,
    };
  }
}

/**
 * 动画信息缓存
 */
export class AnimeCache {
  private cacheManager = new SearchCacheManager();

  /**
   * 获取动画详情
   */
  async getAnimeDetails(animeId: string): Promise<any | null> {
    return await this.cacheManager.get('ANIME', animeId);
  }

  /**
   * 设置动画详情
   */
  async setAnimeDetails(animeId: string, data: any, ttl?: number): Promise<void> {
    await this.cacheManager.set('ANIME', animeId, data, ttl);
  }

  /**
   * 删除动画详情
   */
  async removeAnimeDetails(animeId: string): Promise<void> {
    await this.cacheManager.remove('ANIME', animeId);
  }
}

/**
 * 日志缓存
 */
export class LogCache {
  private cacheManager = new SearchCacheManager();

  /**
   * 添加日志
   */
  async addLog(level: 'info' | 'warn' | 'error' | 'debug', message: string): Promise<void> {
    const timestamp = new Date().toISOString();
    const logKey = `${timestamp.split('T')[0]}`; // 按日期分组

    const existingLogs = await this.cacheManager.get<Array<{ timestamp: string, level: string, message: string }>>('LOGS', logKey) || [];
    existingLogs.push({ timestamp, level, message });

    // 限制每日日志数量
    if (existingLogs.length > STORAGE_CONFIG.TTL.USER_LOGS / 60) { // 假设每分钟最多1条
      existingLogs.shift(); // 移除最老的日志
    }

    await this.cacheManager.set('LOGS', logKey, existingLogs);
  }

  /**
   * 获取日志
   */
  async getLogs(date?: string): Promise<Array<{ timestamp: string, level: string, message: string }>> {
    const logKey = date || new Date().toISOString().split('T')[0];
    return await this.cacheManager.get('LOGS', logKey) || [];
  }
}

// 导出单例实例
export const searchCache = new SearchCache();
export const animeCache = new AnimeCache();
export const logCache = new LogCache();
export const cacheManager = new SearchCacheManager();

// 定期清理过期缓存（每小时执行一次）
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    cacheManager.cleanup().catch(error => {
      logger.error('Scheduled cache cleanup failed:', error);
    });
  }, 60 * 60 * 1000); // 1小时
}
