/**
 * 获取缓存数据详情API
 * GET /api/cache/details
 */

import {
  getAllAnimesFromStorage,
  getStorageStats as getAnimeStats
} from '../../utils/anime-storage';
import {
  getAllEpisodes,
  getEpisodeStorageStats
} from '../../utils/episode-storage';

export default defineEventHandler(async (_event) => {
  try {
    // 获取所有番剧数据
    const animes = await getAllAnimesFromStorage();

    // 获取所有集数数据
    const episodes = getAllEpisodes();

    // 获取统计信息
    const animeStats = await getAnimeStats();
    const episodeStats = getEpisodeStorageStats();

    return {
      success: true,
      data: {
        // 番剧数据
        animes: animes.map(anime => ({
          animeId: anime.animeId,
          animeTitle: anime.animeTitle,
          type: anime.type,
          episodeCount: anime.episodeCount,
          imageUrl: anime.imageUrl,
          rating: anime.rating,
          startDate: anime.startDate,
          isFavorited: anime.isFavorited
        })),

        // 集数数据
        episodes: episodes.map(episode => ({
          id: episode.id,
          url: episode.url,
          title: episode.title || `Episode ${episode.id}`
        })),

        // 统计信息
        stats: {
          animeCount: animeStats.totalAnimes,
          animeMaxCapacity: animeStats.maxCapacity,
          animeUsagePercentage: animeStats.usagePercentage,
          episodeCount: episodeStats.totalEpisodes,
          episodeMaxCapacity: episodeStats.maxCapacity,
          episodeUsagePercentage: episodeStats.usagePercentage,
          totalItems: animeStats.totalAnimes + episodeStats.totalEpisodes
        }
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get cache details:', error);

    return {
      success: false,
      message: 'Failed to get cache details',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
});
