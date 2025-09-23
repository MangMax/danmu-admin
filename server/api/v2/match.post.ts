/**
 * 匹配动漫端点
 * POST /api/v2/match
 * Body: { fileName: "动漫名称 S01E01" }
 */
import useLogger from '~~/server/composables/useLogger';

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
        if (anime.animeTitle.includes(title) && event.node.req.url) {
          const bangumiData = await $fetch(`/api/v2/bangumi/${anime.bangumiId}`)
          logger.debug("判断剧集", bangumiData);
          if (bangumiData.bangumi.episodes.length >= episode) {
            // 先判断season
            if (matchSeason(anime, title, season)) {
              resEpisode = bangumiData.bangumi.episodes[episode - 1];
              resAnime = anime;
              break;
            }
          }
        }
      }
    }
    else {
      // 判断电影
      for (const anime of searchResults) {
        const animeTitle = anime.animeTitle.split("(")[0].trim();
        if (animeTitle === title) {
          const bangumiData = await $fetch(`/api/v2/bangumi/${anime.bangumiId}`);
          logger.debug("判断电影", bangumiData);
          if (bangumiData.bangumi.episodes.length > 0) {
            resEpisode = bangumiData.bangumi.episodes[0];
            resAnime = anime;
            break;
          }
        }
      }
    }

    // 如果都没有找到则返回第一个
    if (!resAnime) {
      for (const anime of searchResults) {
        const bangumiData = await $fetch(`/api/v2/bangumi/${anime.bangumiId}`);
        logger.debug("判断电影", bangumiData);
        if (bangumiData.bangumi.episodes.length > 0) {
          resEpisode = bangumiData.bangumi.episodes[0];
          resAnime = anime;
          break;
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
