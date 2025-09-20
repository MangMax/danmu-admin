/**
 * 获取番剧详情端点
 * GET /api/v2/bangumi/[animeId]
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  const timer = createTimer();

  try {
    // 获取路径参数
    const pathParams = getPathParams(event);
    const animeIdStr = pathParams.animeId;

    // 验证 animeId 参数
    const { isValid, value: animeId, error } = validateNumericParam(animeIdStr, 'animeId');
    if (!isValid) {
      logger.warn('Invalid animeId parameter:', error);
      const responseTime = timer.end();
      logApiResponse(`/api/v2/bangumi/${animeIdStr}`, 400, responseTime);

      throw createError({
        statusCode: 400,
        statusMessage: error
      });
    }

    logger.info(`Fetching bangumi details for animeId: ${animeId}`);

    // 从存储中获取动漫信息
    const anime = await getAnimeFromStorage(animeId!);

    // 如果找不到，返回 404
    if (!anime) {
      logger.warn(`Anime with ID ${animeId} not found`);
      const responseTime = timer.end();
      logApiResponse(`/api/v2/bangumi/${animeId}`, 404, responseTime);

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

    const responseTime = timer.end();
    logApiResponse(`/api/v2/bangumi/${animeId}`, 200, responseTime);

    return createBangumiResponse(bangumi);

  } catch (error: any) {
    logger.error('Get bangumi failed:', error);
    const responseTime = timer.end();
    const pathParams = getPathParams(event);
    logApiResponse(`/api/v2/bangumi/${pathParams.animeId || 'unknown'}`, error.statusCode || 500, responseTime);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during bangumi fetch'
    });
  }
});
