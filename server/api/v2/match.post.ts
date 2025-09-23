/**
 * 匹配动漫端点
 * POST /api/v2/match
 * Body: { fileName: "动漫名称 S01E01" }
 */
import useLogger from '~~/server/composables/useLogger';
import { getBangumiDetails } from '~~/server/utils/bangumi-utils';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  const timer = createTimer();

  try {
    // 解析请求体
    const body = await safeParseJSON(event);

    // 验证请求体
    if (!body || !body.fileName) {
      logger.warn('Missing fileName parameter in request body');
      const responseTime = timer.end();
      logApiResponse('/api/v2/match', 400, responseTime);

      throw createError({
        statusCode: 400,
        statusMessage: 'Missing fileName parameter in request body'
      });
    }

    const { fileName } = body;

    logger.info(`Processing anime match for fileName: ${fileName}`);

    // 解析文件名
    const parsed = parseFileName(fileName);
    const { title, season, episode } = parsed;

    logger.info('Parsed filename:', { title, season, episode });

    // 搜索动漫
    const searchRequest: SearchRequest = {
      keyword: title,
      options: {
        enableCache: true,
        timeout: 30000
      }
    };

    const searchResults = await searchAnimes(searchRequest);

    if (searchResults.length === 0) {
      logger.info(`No anime found for title: ${title}`);
      const responseTime = timer.end();
      logApiResponse('/api/v2/match', 200, responseTime);

      return createMatchResponse(false, []);
    }

    let resAnime: AnimeSearchResult | null = null;
    let resEpisode: Episode | null = null;

    if (season && episode) {
      // 遍历搜索结果寻找匹配的动漫
      for (const anime of searchResults) {
        if (anime.animeTitle.includes(title)) {
          try {
            const bangumiData = await getBangumiDetails(anime.animeId);
            logger.debug("判断剧集", bangumiData);
            if (bangumiData.episodes.length >= episode) {
              // 先判断season
              if (matchSeason(anime, title, season)) {
                resEpisode = bangumiData.episodes[episode - 1];
                resAnime = anime;
                break;
              }
            }
          } catch (error) {
            logger.warn(`Failed to get bangumi details for animeId ${anime.animeId}:`, error);
            continue;
          }
        }
      }
    }
    else {
      // 判断电影
      for (const anime of searchResults) {
        const animeTitle = anime.animeTitle.split("(")[0].trim();
        if (animeTitle === title) {
          try {
            const bangumiData = await getBangumiDetails(anime.animeId);
            logger.debug("判断电影", bangumiData);
            if (bangumiData.episodes.length > 0) {
              resEpisode = bangumiData.episodes[0];
              resAnime = anime;
              break;
            }
          } catch (error) {
            logger.warn(`Failed to get bangumi details for animeId ${anime.animeId}:`, error);
            continue;
          }
        }
      }
    }

    // 如果都没有找到则返回第一个
    if (!resAnime) {
      for (const anime of searchResults) {
        try {
          const bangumiData = await getBangumiDetails(anime.animeId);
          logger.debug("判断电影", bangumiData);
          if (bangumiData.episodes.length > 0) {
            resEpisode = bangumiData.episodes[0];
            resAnime = anime;
            break;
          }
        } catch (error) {
          logger.warn(`Failed to get bangumi details for animeId ${anime.animeId}:`, error);
          continue;
        }
      }
    }

    let isMatched = false;
    let matches: MatchResult[] = [];

    if (resEpisode && resAnime) {
      isMatched = true;
      matches = [{
        episodeId: resEpisode.episodeId,
        animeId: resAnime.animeId,
        animeTitle: resAnime.animeTitle,
        episodeTitle: resEpisode.episodeTitle,
        type: resAnime.type,
        typeDescription: resAnime.typeDescription,
        shift: 0,
        imageUrl: resAnime.imageUrl
      }];
    }

    logger.info(`Match result: isMatched=${isMatched}, matches=${matches.length}`);

    const responseTime = timer.end();
    logApiResponse('/api/v2/match', 200, responseTime);

    return createMatchResponse(isMatched, matches);

  } catch (error: any) {
    logger.error('Match anime failed:', error);
    const responseTime = timer.end();
    logApiResponse('/api/v2/match', error.statusCode || 500, responseTime);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during match'
    });
  }
});
