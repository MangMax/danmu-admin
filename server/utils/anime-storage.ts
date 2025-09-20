/**
 * 动漫数据存储管理
 * 使用 Nuxt 的 useStorage API 实现持久化存储
 */

import useLogger from '~~/server/composables/useLogger';
import { removeEpisodeByUrl } from './episode-storage';

const logger = useLogger();

const MAX_ANIMES = 100;

// 存储键名
const ANIME_STORAGE_KEY = 'animes:data';
const ANIME_STATS_KEY = 'animes:stats';

/**
 * 获取动漫存储实例
 */
async function getAnimeStorage(): Promise<Record<number, AnimeSearchResult>> {
  const storage = useStorage('default');
  const data = await storage.getItem<Record<number, AnimeSearchResult>>(ANIME_STORAGE_KEY);
  return data || {};
}

/**
 * 保存动漫数据到存储
 */
async function saveAnimeStorage(animes: Record<number, AnimeSearchResult>): Promise<void> {
  const storage = useStorage('default');
  await storage.setItem(ANIME_STORAGE_KEY, animes);

  // 更新统计信息
  const stats = {
    totalAnimes: Object.keys(animes).length,
    maxCapacity: MAX_ANIMES,
    usagePercentage: Math.round((Object.keys(animes).length / MAX_ANIMES) * 100),
    lastUpdated: new Date().toISOString()
  };
  await storage.setItem(ANIME_STATS_KEY, stats);
}

/**
 * 添加动漫到存储
 */
export async function addAnimeToStorage(anime: AnimeSearchResult): Promise<boolean> {
  try {
    const animes = await getAnimeStorage();

    // 检查是否已存在
    if (animes[anime.animeId]) {
      logger.debug(`Anime ${anime.animeId} already exists in storage`);
      return false;
    }

    // 检查存储大小限制
    const currentCount = Object.keys(animes).length;
    if (currentCount >= MAX_ANIMES) {
      // 删除最早添加的动漫（简单的 LRU 策略）
      const firstKey = Object.keys(animes)[0];
      if (firstKey) {
        const oldestAnime = animes[parseInt(firstKey)];
        delete animes[parseInt(firstKey)];

        // 清理该动漫的剧集数据
        await cleanupAnimeEpisodes(oldestAnime);

        logger.debug(`Removed oldest anime ${firstKey} and its episodes from storage`);
      }
    }

    animes[anime.animeId] = anime;
    await saveAnimeStorage(animes);
    logger.debug(`Added anime ${anime.animeId} to storage: ${anime.animeTitle}`);
    return true;
  } catch (error) {
    logger.error('Failed to add anime to storage:', error);
    return false;
  }
}

/**
 * 批量添加动漫到存储
 */
export async function addAnimesToStorage(animes: AnimeSearchResult[]): Promise<number> {
  let addedCount = 0;
  for (const anime of animes) {
    if (await addAnimeToStorage(anime)) {
      addedCount++;
    }
  }
  logger.info(`Added ${addedCount} out of ${animes.length} animes to storage`);
  return addedCount;
}

/**
 * 从存储中获取动漫
 */
export async function getAnimeFromStorage(animeId: number): Promise<AnimeSearchResult | null> {
  try {
    const animes = await getAnimeStorage();
    const anime = animes[animeId];
    if (anime) {
      logger.debug(`Retrieved anime ${animeId} from storage: ${anime.animeTitle}`);
    } else {
      logger.debug(`Anime ${animeId} not found in storage`);
    }
    return anime || null;
  } catch (error) {
    logger.error('Failed to get anime from storage:', error);
    return null;
  }
}

/**
 * 搜索存储中的动漫
 */
export async function searchAnimesInStorage(keyword: string): Promise<AnimeSearchResult[]> {
  try {
    const animes = await getAnimeStorage();
    const results: AnimeSearchResult[] = [];
    const searchKeyword = keyword.toLowerCase();

    for (const anime of Object.values(animes)) {
      if (anime.animeTitle.toLowerCase().includes(searchKeyword)) {
        results.push(anime);
      }
    }

    logger.debug(`Found ${results.length} animes in storage for keyword: ${keyword}`);
    return results;
  } catch (error) {
    logger.error('Failed to search animes in storage:', error);
    return [];
  }
}

/**
 * 存储统计信息类型
 */
export interface StorageStats {
  totalAnimes: number;
  maxCapacity: number;
  usagePercentage: number;
  lastUpdated: string;
}

/**
 * 获取存储统计信息
 */
export async function getStorageStats(): Promise<StorageStats> {
  try {
    const storage = useStorage('default');
    const stats = await storage.getItem(ANIME_STATS_KEY);

    if (stats) {
      return stats as StorageStats;
    }

    // 如果没有统计信息，计算当前数据
    const animes = await getAnimeStorage();
    const animeCount = Object.keys(animes).length;

    return {
      totalAnimes: animeCount,
      maxCapacity: MAX_ANIMES,
      usagePercentage: Math.round((animeCount / MAX_ANIMES) * 100),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Failed to get storage stats:', error);
    return {
      totalAnimes: 0,
      maxCapacity: MAX_ANIMES,
      usagePercentage: 0,
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * 批量清理动漫的剧集数据
 */
async function cleanupAllAnimeEpisodes(animes: Record<number, AnimeSearchResult>): Promise<void> {
  try {
    let totalCleaned = 0;
    for (const anime of Object.values(animes)) {
      if (anime.links && Array.isArray(anime.links)) {
        for (const link of anime.links) {
          if (link.url) {
            const removed = removeEpisodeByUrl(link.url);
            if (removed) {
              totalCleaned++;
            }
          }
        }
      }
    }
    logger.info(`Cleaned up ${totalCleaned} episodes from all animes`);
  } catch (error) {
    logger.error('Failed to cleanup all anime episodes:', error);
  }
}

/**
 * 清空存储
 */
export async function clearStorage(): Promise<void> {
  try {
    const animes = await getAnimeStorage();
    const count = Object.keys(animes).length;

    // 先清理所有动漫的剧集数据
    await cleanupAllAnimeEpisodes(animes);

    const storage = useStorage('default');
    await storage.removeItem(ANIME_STORAGE_KEY);
    await storage.removeItem(ANIME_STATS_KEY);

    logger.info(`Cleared ${count} animes and their episodes from storage`);
  } catch (error) {
    logger.error('Failed to clear storage:', error);
  }
}

/**
 * 获取所有动漫 ID
 */
export async function getAllAnimeIds(): Promise<number[]> {
  try {
    const animes = await getAnimeStorage();
    return Object.keys(animes).map(id => parseInt(id));
  } catch (error) {
    logger.error('Failed to get all anime IDs:', error);
    return [];
  }
}

/**
 * 检查动漫是否存在
 */
export async function hasAnime(animeId: number): Promise<boolean> {
  try {
    const animes = await getAnimeStorage();
    return !!animes[animeId];
  } catch (error) {
    logger.error('Failed to check anime existence:', error);
    return false;
  }
}

/**
 * 更新动漫信息
 */
export async function updateAnimeInStorage(animeId: number, updates: Partial<AnimeSearchResult>): Promise<boolean> {
  try {
    const animes = await getAnimeStorage();
    const existing = animes[animeId];

    if (!existing) {
      logger.warn(`Anime ${animeId} not found for update`);
      return false;
    }

    animes[animeId] = { ...existing, ...updates };
    await saveAnimeStorage(animes);
    logger.debug(`Updated anime ${animeId} in storage`);
    return true;
  } catch (error) {
    logger.error('Failed to update anime in storage:', error);
    return false;
  }
}

/**
 * 移除动漫
 */
export async function removeAnimeFromStorage(animeId: number): Promise<boolean> {
  try {
    const animes = await getAnimeStorage();
    const anime = animes[animeId];

    if (!anime) {
      logger.warn(`Anime ${animeId} not found for removal`);
      return false;
    }

    // 删除动漫数据
    delete animes[animeId];
    await saveAnimeStorage(animes);

    // 删除相关的剧集数据
    await cleanupAnimeEpisodes(anime);

    logger.debug(`Removed anime ${animeId} and its episodes from storage`);
    return true;
  } catch (error) {
    logger.error('Failed to remove anime from storage:', error);
    return false;
  }
}

/**
 * 清理动漫相关的剧集数据
 */
async function cleanupAnimeEpisodes(anime: AnimeSearchResult): Promise<void> {
  try {
    // 检查动漫是否有 links 属性（剧集链接）
    if (anime.links && Array.isArray(anime.links)) {
      let cleanedCount = 0;
      for (const link of anime.links) {
        if (link.url) {
          const removed = removeEpisodeByUrl(link.url);
          if (removed) {
            cleanedCount++;
          }
        }
      }
      logger.debug(`Cleaned up ${cleanedCount} episodes for anime ${anime.animeId}`);
    }
  } catch (error) {
    logger.error('Failed to cleanup anime episodes:', error);
  }
}

/**
 * 获取所有番剧数据
 */
export async function getAllAnimesFromStorage(): Promise<AnimeSearchResult[]> {
  try {
    const animes = await getAnimeStorage();
    return Object.values(animes);
  } catch (error) {
    logger.error('Failed to get all animes from storage:', error);
    return [];
  }
}