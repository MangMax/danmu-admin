/**
 * 番剧工具函数
 * 提供番剧详情获取等功能
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

/**
 * 获取番剧详情（从 [animeId].get.ts 提取的核心逻辑） 
 * @param animeId 动漫ID
 * @returns 番剧详情对象
 */
export async function getBangumiDetails(animeId: number): Promise<BangumiDetail> {
  logger.info(`Fetching bangumi details for animeId: ${animeId}`);

  // 从存储中获取动漫信息
  const anime = await getAnimeFromStorage(animeId);

  // 如果找不到，抛出错误
  if (!anime) {
    logger.warn(`Anime with ID ${animeId} not found`);
    throw createError({
      statusCode: 404,
      statusMessage: 'Anime not found'
    });
  }

  // 构建番剧详情响应
  const bangumi: BangumiDetail = {
    animeId: anime.animeId,
    bangumiId: anime.bangumiId || String(anime.animeId),
    animeTitle: anime.animeTitle,
    imageUrl: anime.imageUrl || '',
    isOnAir: true,
    airDay: 1,
    isFavorited: anime.isFavorited || false,
    rating: anime.rating || 0,
    type: anime.type || 'Unknown',
    typeDescription: anime.typeDescription || anime.type || 'Unknown',
    seasons: [{
      id: `season-${anime.animeId}`,
      airDate: anime.startDate || new Date().toISOString(),
      name: 'Season 1',
      episodeCount: anime.episodeCount || 1
    }],
    episodes: []
  };

  // 生成集数信息（基于存储的 links，包含正确的自增ID）
  if (anime.links && anime.links.length > 0) {
    // 使用存储的 links，这些已经通过 addEpisode 处理，包含正确的ID
    anime.links.forEach((link, index) => {
      if (link.id !== undefined) {
        bangumi.episodes.push({
          seasonId: `season-${anime.animeId}`,
          episodeId: link.id, // 使用存储的正确ID
          episodeTitle: link.title,
          episodeNumber: (index + 1).toString(),
          airDate: anime.startDate || new Date().toISOString()
        });
      }
    });
  } else {
    // 兜底逻辑：如果没有 links，生成基本的集数信息
    const episodeCount = anime.episodeCount || 1;
    for (let i = 1; i <= Math.min(episodeCount, 200); i++) { // 限制最多200集
      bangumi.episodes.push({
        seasonId: `season-${anime.animeId}`,
        episodeId: (anime.animeId || 0) + i, // 这是兜底逻辑，理论上不应该执行
        episodeTitle: `第${i}集`,
        episodeNumber: i.toString(),
        airDate: anime.startDate || new Date().toISOString()
      });
    }
  }

  logger.info(`Fetched bangumi details for ${anime.animeTitle} with ${bangumi.episodes.length} episodes`);

  return bangumi;
}

/**
 * 获取番剧详情并包装为响应格式
 * @param animeId 动漫ID
 * @returns 包装后的响应对象
 */
export async function getBangumiResponse(animeId: number): Promise<any> {
  const bangumi = await getBangumiDetails(animeId);
  return createBangumiResponse(bangumi);
}

/**
 * 批量获取番剧详情
 * @param animeIds 动漫ID数组
 * @returns 番剧详情数组
 */
export async function getBatchBangumiDetails(animeIds: number[]): Promise<BangumiDetail[]> {
  const results = await Promise.allSettled(
    animeIds.map(id => getBangumiDetails(id))
  );

  return results
    .filter((result): result is PromiseFulfilledResult<BangumiDetail> => result.status === 'fulfilled')
    .map(result => result.value);
}

/**
 * 检查动漫是否存在
 * @param animeId 动漫ID
 * @returns 是否存在
 */
export async function checkAnimeExists(animeId: number): Promise<boolean> {
  try {
    const anime = await getAnimeFromStorage(animeId);
    return !!anime;
  } catch (error) {
    logger.warn(`Error checking anime existence for ID ${animeId}:`, error);
    return false;
  }
}
