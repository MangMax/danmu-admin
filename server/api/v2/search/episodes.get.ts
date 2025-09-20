/**
 * 搜索集数端点
 * GET /api/v2/search/episodes?anime=动漫名称&episode=集数
 */

import useLogger from '~~/server/composables/useLogger';
import { searchAnimes } from '~~/server/utils/search/search-router';
import { getAnimeFromStorage } from '~~/server/utils/anime-storage';
import type { SearchRequest } from '~~/shared/types/search';

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

    // 先搜索动漫（完全基于原版逻辑）
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

      return {
        errorCode: 0,
        success: true,
        errorMessage: "",
        hasMore: false,
        animes: []
      };
    }

    let resultAnimes = [];

    // 遍历所有找到的动漫，获取它们的集数信息（基于原版逻辑）
    for (const animeItem of searchResults) {
      // 从存储中获取对应的动漫（包含 links 信息）
      const storedAnime = await getAnimeFromStorage(animeItem.animeId);

      if (!storedAnime || !storedAnime.links || storedAnime.links.length === 0) {
        logger.debug(`No stored anime or links found for: ${animeItem.animeId}`);
        continue;
      }

      // 构建集数信息（基于原版的 getBangumi 逻辑）
      // 注意：存储的anime.links已经通过addEpisode处理，包含正确的自增ID
      const allEpisodes = storedAnime.links.map((link, index) => ({
        seasonId: `season-${storedAnime.animeId}`,
        episodeId: link.id, // 直接使用存储的ID，这已经是通过addEpisode生成的正确ID
        episodeTitle: link.title,
        episodeNumber: String(index + 1),
        airDate: storedAnime.startDate
      }));

      let filteredEpisodes = allEpisodes;

      // 根据 episode 参数过滤集数（完全基于原版逻辑）
      if (episode) {
        if (episode === "movie") {
          // 仅保留剧场版结果
          filteredEpisodes = allEpisodes.filter(ep =>
            animeItem.typeDescription && (
              animeItem.typeDescription.includes("电影") ||
              animeItem.typeDescription.includes("剧场版") ||
              ep.episodeTitle.toLowerCase().includes("movie") ||
              ep.episodeTitle.includes("剧场版")
            )
          );
        } else if (/^\d+$/.test(episode)) {
          // 纯数字，仅保留指定集数
          const targetEpisode = parseInt(episode);
          filteredEpisodes = allEpisodes.filter(ep =>
            parseInt(ep.episodeNumber) === targetEpisode
          );
        }
      }

      // 只有当过滤后还有集数时才添加到结果中
      if (filteredEpisodes.length > 0) {
        resultAnimes.push({
          animeId: animeItem.animeId,
          animeTitle: animeItem.animeTitle,
          type: animeItem.type,
          typeDescription: animeItem.typeDescription,
          episodes: filteredEpisodes.map(ep => ({
            episodeId: ep.episodeId,
            episodeTitle: ep.episodeTitle
          }))
        });
      }
    }

    logger.info(`Found ${resultAnimes.length} animes with filtered episodes`);

    const responseTime = timer.end();
    logApiResponse('/api/v2/search/episodes', 200, responseTime);

    return {
      errorCode: 0,
      success: true,
      errorMessage: "",
      animes: resultAnimes
    };

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
