/**
 * 缓存系统使用示例
 * 展示如何使用基于 useStorage 的新缓存系统
 */

import { searchCache, animeCache, logCache, cacheManager } from './storage-cache';
import type { AnimeSearchResult } from '#shared/types/search';

/**
 * 搜索缓存使用示例
 */
export async function searchCacheExample() {
  const keyword = '进击的巨人';
  const providers = ['360kan', 'vod'] as const;

  // 检查缓存
  let results = await searchCache.getSearchResults(keyword, providers);

  if (!results) {
    // 模拟搜索结果
    results = [
      {
        provider: '360kan',
        animeId: 12345,
        bangumiId: '12345',
        animeTitle: '进击的巨人第一季',
        type: '动画',
        typeDescription: '日本动画',
        imageUrl: 'https://example.com/image.jpg',
        startDate: '2013-04-01T00:00:00',
        episodeCount: 25,
        rating: 9.0,
        isFavorited: false,
        year: '2013'
      }
    ] as AnimeSearchResult[];

    // 设置缓存，TTL 30分钟
    await searchCache.setSearchResults(keyword, providers, results);
    console.log('搜索结果已缓存');
  } else {
    console.log('使用缓存的搜索结果');
  }

  return results;
}

/**
 * 动画详情缓存示例
 */
export async function animeCacheExample() {
  const animeId = '12345';

  // 检查缓存
  let animeDetails = await animeCache.getAnimeDetails(animeId);

  if (!animeDetails) {
    // 模拟获取动画详情
    animeDetails = {
      id: animeId,
      title: '进击的巨人',
      description: '人类与巨人的战争...',
      episodes: [
        { id: 1, title: '第一集', url: 'https://example.com/ep1' },
        { id: 2, title: '第二集', url: 'https://example.com/ep2' }
      ]
    };

    // 设置缓存，TTL 2小时
    await animeCache.setAnimeDetails(animeId, animeDetails);
    console.log('动画详情已缓存');
  } else {
    console.log('使用缓存的动画详情');
  }

  return animeDetails;
}

/**
 * 日志缓存示例
 */
export async function logCacheExample() {
  // 添加日志
  await logCache.addLog('info', '用户搜索了进击的巨人');
  await logCache.addLog('warn', '搜索结果较少');
  await logCache.addLog('error', '某个提供商请求失败');

  // 获取今日日志
  const todayLogs = await logCache.getLogs();
  console.log('今日日志数量:', todayLogs.length);

  return todayLogs;
}

/**
 * 缓存管理示例
 */
export async function cacheManagementExample() {
  // 获取缓存统计
  const stats = await cacheManager.getStats();
  console.log('缓存统计:', stats);

  // 清理过期缓存
  await cacheManager.cleanup();
  console.log('已清理过期缓存');

  // 获取清理后的统计
  const newStats = await cacheManager.getStats();
  console.log('清理后统计:', newStats);

  return newStats;
}

/**
 * 搜索缓存管理示例
 */
export async function searchCacheManagementExample() {
  // 清理特定关键词的搜索缓存
  await searchCache.clearSearchCache('进击的巨人');
  console.log('已清理"进击的巨人"相关搜索缓存');

  // 清理所有搜索缓存
  await searchCache.clearSearchCache();
  console.log('已清理所有搜索缓存');

  // 获取搜索统计
  const searchStats = await searchCache.getSearchStats();
  console.log('搜索缓存统计:', searchStats);

  return searchStats;
}

/**
 * 完整的工作流示例
 */
export async function fullWorkflowExample() {
  console.log('=== 缓存系统工作流示例 ===');

  // 1. 搜索并缓存
  console.log('1. 执行搜索并缓存结果');
  const searchResults = await searchCacheExample();

  // 2. 获取动画详情并缓存
  console.log('2. 获取动画详情并缓存');
  const animeDetails = await animeCacheExample();

  // 3. 记录日志
  console.log('3. 记录操作日志');
  const logs = await logCacheExample();

  // 4. 检查缓存状态
  console.log('4. 检查缓存状态');
  const stats = await cacheManagementExample();

  // 5. 管理搜索缓存
  console.log('5. 管理搜索缓存');
  const searchStats = await searchCacheManagementExample();

  return {
    searchResults,
    animeDetails,
    logs,
    stats,
    searchStats
  };
}
