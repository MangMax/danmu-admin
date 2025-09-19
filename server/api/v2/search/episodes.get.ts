/**
 * 搜索集数端点
 * GET /api/v2/search/episodes?anime=动漫名称&episode=集数
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  const timer = createTimer();

  try {
    // 获取查询参数
    const queryParams = getQueryParams(event);

    // 验证必需参数
    const { isValid, missing } = validateRequiredParams(queryParams, ['anime']);
    if (!isValid) {
      logger.warn('Missing required parameters:', missing);
      const responseTime = timer.end();
      logApiResponse('/api/v2/search/episodes', 400, responseTime);

      throw createError({
        statusCode: 400,
        statusMessage: `Missing required parameters: ${missing.join(', ')}`
      });
    }

    const { anime, episode } = queryParams;

    logger.info(`Searching episodes for anime: ${anime}, episode: ${episode || 'all'}`);

    // 先搜索动漫
    const searchRequest: SearchRequest = {
      keyword: anime,
      options: {
        enableCache: true,
        timeout: 30000
      }
    };

    const searchResults = await searchAnimes(searchRequest);

    if (searchResults.length === 0) {
      logger.info(`No anime found for: ${anime}`);
      const responseTime = timer.end();
      logApiResponse('/api/v2/search/episodes', 200, responseTime);

      return createSuccessResponse({
        hasMore: false,
        animes: []
      });
    }

    let resultAnimes = [];

    // 遍历所有找到的动漫，获取它们的集数信息
    for (const animeItem of searchResults) {
      // 这里需要获取具体的集数信息
      // 由于我们还没有实现 getBangumi，先返回基本信息
      let filteredEpisodes: Array<{ episodeId: number; episodeTitle: string }> = [];

      // 根据 episode 参数过滤集数
      if (episode) {
        if (episode === "movie") {
          // 仅保留剧场版结果
          if (animeItem.type && (
            animeItem.type.includes("电影") ||
            animeItem.type.includes("剧场版") ||
            animeItem.animeTitle.toLowerCase().includes("movie") ||
            animeItem.animeTitle.includes("剧场版")
          )) {
            filteredEpisodes = [{
              episodeId: animeItem.animeId,
              episodeTitle: animeItem.animeTitle
            }];
          }
        } else if (/^\d+$/.test(episode)) {
          // 纯数字，仅保留指定集数
          const targetEpisode = parseInt(episode);
          if (animeItem.episodeCount >= targetEpisode) {
            filteredEpisodes = [{
              episodeId: animeItem.animeId + targetEpisode,
              episodeTitle: `第${targetEpisode}集`
            }];
          }
        }
      } else {
        // 返回所有集数的基本信息
        for (let i = 1; i <= Math.min(animeItem.episodeCount || 1, 50); i++) {
          filteredEpisodes.push({
            episodeId: animeItem.animeId + i,
            episodeTitle: `第${i}集`
          });
        }
      }

      // 只有当过滤后还有集数时才添加到结果中
      if (filteredEpisodes.length > 0) {
        resultAnimes.push({
          animeId: animeItem.animeId,
          animeTitle: animeItem.animeTitle,
          type: animeItem.type,
          typeDescription: animeItem.typeDescription,
          episodes: filteredEpisodes
        });
      }
    }

    logger.info(`Found ${resultAnimes.length} animes with filtered episodes`);

    const responseTime = timer.end();
    logApiResponse('/api/v2/search/episodes', 200, responseTime);

    return createSuccessResponse({
      animes: resultAnimes
    });

  } catch (error: any) {
    logger.error('Search episodes failed:', error);
    const responseTime = timer.end();
    logApiResponse('/api/v2/search/episodes', error.statusCode || 500, responseTime);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during episode search'
    });
  }
});
