/**
 * 搜索动漫端点
 * GET /api/v2/search/anime?keyword=关键词
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  const timer = createTimer();

  try {
    // 获取查询参数
    const queryParams = getQueryParams(event);

    // 验证必需参数
    const { isValid, missing } = validateRequiredParams(queryParams, ['keyword']);
    if (!isValid) {
      logger.warn('Missing required parameters:', missing);
      const responseTime = timer.end();
      logApiResponse('/api/v2/search/anime', 400, responseTime);

      throw createError({
        statusCode: 400,
        statusMessage: `Missing required parameters: ${missing.join(', ')}`
      });
    }

    const { keyword, providers, maxResults, season } = queryParams;

    logger.info(`Searching anime with keyword: ${keyword}`);

    // 构建搜索请求
    const searchRequest: SearchRequest = {
      keyword,
      providers: providers ? providers.split(',') as any : undefined,
      maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
      season: season ? parseInt(season, 10) : undefined,
      options: {
        enableCache: true,
        timeout: 30000
      }
    };

    // 执行搜索
    const results = await searchAnimes(searchRequest);

    // 将搜索结果添加到存储中以供后续使用
    if (results.length > 0) {
      await addAnimesToStorage(results);

      // 同时为每个动漫的播放链接生成 episode URL 映射
      for (const anime of results) {
        if (anime.playlinks && anime.playlinks.length > 0) {
          const episodeUrls = anime.playlinks.map(link => ({
            url: link.url,
            title: link.title || `${anime.animeTitle} - ${link.name}`
          }));
          addEpisodeUrls(episodeUrls);
        }
      }
    }

    logger.info(`Found ${results.length} anime results for keyword: ${keyword}`);

    const responseTime = timer.end();
    logApiResponse('/api/v2/search/anime', 200, responseTime);

    // 返回搜索结果
    return createSearchAnimeResponse(results, `Found ${results.length} results`);

  } catch (error: any) {
    logger.error('Search anime failed:', error);
    const responseTime = timer.end();
    logApiResponse('/api/v2/search/anime', error.statusCode || 500, responseTime);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during search'
    });
  }
});
