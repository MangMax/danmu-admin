/**
 * API 首页端点
 * GET /api
 */

import useLogger from '~~/server/composables/useLogger';
import { config } from '~~/server/utils/env-config';

const logger = useLogger();

export default defineEventHandler(async (_event) => {
  const timer = createTimer();

  try {
    logger.info('Accessed API homepage');

    const currentConfig = await config.get();
    const isTokenAuthEnabled = await config.isTokenAuthEnabled();

    const responseData = {
      message: "Welcome to the Danmu API Server (Nuxt Implementation)",
      version: currentConfig.version,
      runtime: currentConfig.runtime,
      repository: "https://github.com/huangxd-/danmu_api.git",
      description: "基于danmu_api项目为基础开发的admin项目，不适合所有人部署，也不建议你部署，只是用来练习nuxt技术栈",
      notice: "本项目仅为个人爱好开发，代码开源。如有任何侵权行为，请联系本人删除。",
      endpoints: {
        search: {
          anime: "/api/v2/search/anime?keyword={关键词}",
          episodes: "/api/v2/search/episodes?anime={动漫名称}&episode={集数}"
        },
        match: "/api/v2/match (POST with {fileName})",
        bangumi: "/api/v2/bangumi/{animeId}",
        comment: "/api/v2/comment/{commentId}",
        logs: "/api/logs",
        config: "/api/config",
        cacheStats: "/api/cache/stats",
        cacheDetails: "/api/cache/details",
        addTestData: "/api/test/add-sample-data (POST)"
      },
      supportedPlatforms: currentConfig.allowedPlatforms,
      tokenAuth: isTokenAuthEnabled ? "enabled" : "disabled",
      environment: {
        nodeEnv: currentConfig.nodeEnv,
        runtime: currentConfig.runtime,
        tokenAuth: isTokenAuthEnabled ? "enabled" : "disabled",
        requestTimeout: currentConfig.requestTimeout,
        maxRetryCount: currentConfig.maxRetryCount,
        maxLogs: currentConfig.maxLogs,
        maxAnimes: currentConfig.maxAnimes
      }
    };

    const responseTime = timer.end();
    logApiResponse('/api', 200, responseTime);

    return createSuccessResponse(responseData);

  } catch (error: any) {
    logger.error('API homepage failed:', error);
    const responseTime = timer.end();
    logApiResponse('/api', error.statusCode || 500, responseTime);

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});
