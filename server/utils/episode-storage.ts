/**
 * 集数 URL 存储管理
 * 模拟 danmu.js 中的 episodeIds 全局状态
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

// 集数 URL 映射存储
const episodeStorage = new Map<number, { id: number; url: string; title: string }>();
let episodeIdCounter = 10001; // 模拟 danmu.js 中的 episodeNum
const MAX_EPISODES = 1000;

/**
 * 添加集数 URL 映射 (指定ID)
 */
export function addEpisodeWithId(id: number, url: string, title: string = ''): boolean {
  try {
    // 检查是否已存在相同的 ID
    if (episodeStorage.has(id)) {
      logger.debug(`Episode ID ${id} already exists in storage`);
      return false;
    }

    // 检查是否已存在相同的 URL
    for (const episode of episodeStorage.values()) {
      if (episode.url === url) {
        logger.debug(`URL ${url} already exists in episode storage`);
        return false;
      }
    }

    // 检查存储大小限制
    if (episodeStorage.size >= MAX_EPISODES) {
      // 删除最早添加的集数（简单的 LRU 策略）
      const firstKey = episodeStorage.keys().next().value;
      if (firstKey !== undefined) {
        episodeStorage.delete(firstKey);
        logger.debug(`Removed oldest episode ${firstKey} from storage`);
      }
    }

    const episode = {
      id,
      url,
      title: title || `Episode ${id}`
    };

    episodeStorage.set(id, episode);
    logger.debug(`Added episode ${id} to storage: ${url}`);
    return true;
  } catch (error) {
    logger.error('Failed to add episode with ID to storage:', error);
    return false;
  }
}

/**
 * 添加集数 URL 映射 (自动生成ID)
 */
export function addEpisodeUrl(url: string, title: string = ''): number | null {
  try {
    // 检查是否已存在相同的 URL
    for (const episode of episodeStorage.values()) {
      if (episode.url === url) {
        logger.debug(`URL ${url} already exists in episode storage`);
        return null;
      }
    }

    // 检查存储大小限制
    if (episodeStorage.size >= MAX_EPISODES) {
      // 删除最早添加的集数（简单的 LRU 策略）
      const firstKey = episodeStorage.keys().next().value;
      if (firstKey !== undefined) {
        episodeStorage.delete(firstKey);
        logger.debug(`Removed oldest episode ${firstKey} from storage`);
      }
    }

    // 自增 ID 并添加
    episodeIdCounter++;
    const newEpisode = { id: episodeIdCounter, url, title };
    episodeStorage.set(episodeIdCounter, newEpisode);

    logger.debug(`Added episode to storage: ${JSON.stringify(newEpisode)}`);
    return episodeIdCounter;
  } catch (error) {
    logger.error('Failed to add episode URL:', error);
    return null;
  }
}

/**
 * 根据 ID 查找 URL
 */
export function findEpisodeUrlById(id: number): string | null {
  try {
    const episode = episodeStorage.get(id);
    if (episode) {
      logger.debug(`Found URL for ID ${id}: ${episode.url}`);
      return episode.url;
    }
    logger.debug(`No URL found for ID: ${id}`);
    return null;
  } catch (error) {
    logger.error('Failed to find URL by ID:', error);
    return null;
  }
}

/**
 * 删除指定 URL 的集数
 */
export function removeEpisodeByUrl(url: string): boolean {
  try {
    let removedCount = 0;
    for (const [id, episode] of episodeStorage.entries()) {
      if (episode.url === url) {
        episodeStorage.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`Removed ${removedCount} episode(s) with URL: ${url}`);
      return true;
    }

    logger.debug(`No episode found with URL: ${url}`);
    return false;
  } catch (error) {
    logger.error('Failed to remove episode by URL:', error);
    return false;
  }
}

/**
 * 批量添加集数 URL
 */
export function addEpisodeUrls(episodes: Array<{ url: string; title: string }>): number[] {
  const addedIds: number[] = [];
  for (const episode of episodes) {
    const id = addEpisodeUrl(episode.url, episode.title);
    if (id !== null) {
      addedIds.push(id);
    }
  }
  logger.info(`Added ${addedIds.length} episode URLs to storage`);
  return addedIds;
}

/**
 * 获取存储统计信息
 */
export function getEpisodeStorageStats() {
  return {
    totalEpisodes: episodeStorage.size,
    maxCapacity: MAX_EPISODES,
    usagePercentage: Math.round((episodeStorage.size / MAX_EPISODES) * 100),
    nextId: episodeIdCounter + 1
  };
}

/**
 * 清空存储
 */
export function clearEpisodeStorage(): void {
  const count = episodeStorage.size;
  episodeStorage.clear();
  episodeIdCounter = 10001; // 重置计数器
  logger.info(`Cleared ${count} episodes from storage`);
}

/**
 * 获取所有集数信息
 */
export function getAllEpisodes(): Array<{ id: number; url: string; title: string }> {
  return Array.from(episodeStorage.values());
}

/**
 * 检查集数是否存在
 */
export function hasEpisode(id: number): boolean {
  return episodeStorage.has(id);
}

/**
 * 根据 URL 查找集数 ID
 */
export function findIdByUrl(url: string): number | null {
  try {
    for (const episode of episodeStorage.values()) {
      if (episode.url === url) {
        return episode.id;
      }
    }
    return null;
  } catch (error) {
    logger.error('Failed to find ID by URL:', error);
    return null;
  }
}

/**
 * 更新集数信息
 */
export function updateEpisode(id: number, updates: { url?: string; title?: string }): boolean {
  try {
    const existing = episodeStorage.get(id);
    if (!existing) {
      logger.warn(`Cannot update episode ${id}: not found in storage`);
      return false;
    }

    const updated = { ...existing, ...updates };
    episodeStorage.set(id, updated);
    logger.debug(`Updated episode ${id} in storage`);
    return true;
  } catch (error) {
    logger.error('Failed to update episode:', error);
    return false;
  }
}