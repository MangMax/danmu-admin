/**
 * 弹幕服务配置 - 使用 Nuxt runtimeConfig
 * 整合现有的存储和日志系统
 */

import { config } from './env-config';
import useLogger from '~~/server/composables/useLogger';
import {
  addAnimeToStorage,
  getAnimeFromStorage,
  searchAnimesInStorage,
  getStorageStats,
  clearStorage
} from './anime-storage';
import {
  addEpisodeUrl,
  findEpisodeUrlById,
  getEpisodeStorageStats,
  clearEpisodeStorage,
  getAllEpisodes
} from './episode-storage';

const logger = useLogger();

/**
 * 获取配置信息
 */
export async function getDanmuConfig() {
  return await config.get();
}

/**
 * 获取允许的平台列表
 */
export async function getAllowedPlatforms() {
  return await config.getAllowedPlatforms();
}

/**
 * Token 认证已禁用
 * 保留函数以维持兼容性
 */
export async function getToken() {
  return ""; // Token 认证已禁用
}

/**
 * 获取第三方服务器地址
 */
export async function getOtherServer() {
  return await config.getOtherServer();
}

/**
 * 获取 VOD 服务器地址
 */
export async function getVodServer() {
  return await config.getVodServer();
}

/**
 * 获取版本号
 */
export async function getVersion() {
  return await config.getVersion();
}

/**
 * 获取最大日志数量
 */
export async function getMaxLogs() {
  return await config.getMaxLogs();
}

/**
 * 获取最大动画数量
 */
export async function getMaxAnimes() {
  return await config.getMaxAnimes();
}

/**
 * 获取请求超时时间
 */
export async function getRequestTimeout() {
  return await config.getRequestTimeout();
}

/**
 * 获取最大重试次数
 */
export async function getMaxRetryCount() {
  return await config.getMaxRetryCount();
}

/**
 * 检查平台是否被允许
 */
export async function isPlatformAllowed(platform: string) {
  return await config.isPlatformAllowed(platform);
}

/**
 * 日志记录函数 - 使用统一的 logger
 */
export function log(level: string, message: string, ...args: any[]) {
  const logMessage = args.length > 0
    ? `${message} ${args.map(arg => typeof arg === "object" ? JSON.stringify(arg) : arg).join(" ")}`
    : message;

  switch (level) {
    case 'error':
      logger.error(logMessage);
      break;
    case 'warn':
      logger.warn(logMessage);
      break;
    case 'info':
      logger.info(logMessage);
      break;
    case 'debug':
      logger.debug(logMessage);
      break;
    default:
      logger.info(logMessage);
  }
}

/**
 * 添加剧集到存储
 */
export function addEpisode(url: string, title: string) {
  try {
    // 使用专业的存储系统添加剧集
    const episodeId = addEpisodeUrl(url, title);
    if (episodeId) {
      const episode = { id: episodeId, url, title };
      log("info", `Added episode to storage:`, episode);
      return episode;
    } else {
      log("info", `URL ${url} already exists in storage, skipping addition.`);
      return null;
    }
  } catch (error) {
    log("error", `Error adding episode:`, error);
    return null;
  }
}

/**
 * 根据 ID 查找 URL
 */
export function findUrlById(id: number) {
  try {
    const url = findEpisodeUrlById(id);
    if (url) {
      log("debug", `Found URL for ID ${id}: ${url}`);
      return url;
    }
    log("warn", `No URL found for ID: ${id}`);
    return null;
  } catch (error) {
    log("error", `Error finding URL by ID ${id}:`, error);
    return null;
  }
}

/**
 * 添加动画到存储系统
 */
export async function addStorageAnime(anime: any) {
  try {
    // 确保 anime 有 links 属性且是数组
    if (!anime.links || !Array.isArray(anime.links)) {
      log("error", `Invalid or missing links in anime:`, anime);
      return false;
    }

    // 处理剧集链接
    const processedLinks: any[] = [];
    for (const link of anime.links) {
      if (link.url) {
        const episode = addEpisode(link.url, link.title);
        if (episode) {
          processedLinks.push(episode);
        }
      } else {
        log("warn", `Invalid link in anime, missing url:`, link);
      }
    }

    // 创建动画对象
    const animeData = {
      ...anime,
      links: processedLinks
    };

    // 使用专业的存储系统
    const success = await addAnimeToStorage(animeData);
    if (success) {
      log("info", `Added anime to storage: ${anime.animeTitle}`);
      return true;
    } else {
      log("warn", `Anime already exists in storage: ${anime.animeTitle}`);
      return false;
    }
  } catch (error) {
    log("error", `Error adding anime:`, error);
    return false;
  }
}

/**
 * 搜索动画
 */
export async function searchStorageAnimes(keyword: string) {
  return await searchAnimesInStorage(keyword);
}

/**
 * 获取动画
 */
export async function getStorageAnime(animeId: number) {
  return await getAnimeFromStorage(animeId);
}

/**
 * 获取所有剧集
 */
export function getAllEpisodesData() {
  return getAllEpisodes();
}

/**
 * 清空所有缓存
 */
export async function clearAllCache() {
  try {
    await clearStorage(); // 清空动画存储
    clearEpisodeStorage(); // 清空剧集存储
    log("info", "All caches cleared successfully");
    return true;
  } catch (error) {
    log("error", "Failed to clear caches:", error);
    return false;
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats() {
  try {
    const animeStats = await getStorageStats();
    const episodeStats = getEpisodeStorageStats();

    return {
      animes: animeStats,
      episodes: episodeStats,
      totalItems: animeStats.totalAnimes + episodeStats.totalEpisodes
    };
  } catch (error) {
    log("error", "Failed to get cache stats:", error);
    return {
      animes: { totalAnimes: 0, maxCapacity: 0, usagePercentage: 0 },
      episodes: { totalEpisodes: 0, maxCapacity: 0, usagePercentage: 0 },
      totalItems: 0
    };
  }
}
