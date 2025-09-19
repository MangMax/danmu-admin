/**
 * API 首页端点
 * GET /api
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (_event) => {
  const timer = createTimer();

  try {
    logger.info('Accessed API homepage');

    const currentConfig = await config.get();

    const responseData = {
      message: "Welcome to the Danmu API Server (Nuxt Implementation)",
      version: currentConfig.version,
      runtime: currentConfig.runtime,
      repository: "https://github.com/huangxd-/danmu_api.git",
      description: "一个人人都能部署的基于 js 的弹幕 API 服务器，支持爱优腾芒哔人弹幕直接获取，兼容弹弹play的搜索、详情查询和弹幕获取接口，并提供日志记录，支持vercel/cloudflare/docker/claw等部署方式，不用提前下载弹幕，没有nas或小鸡也能一键部署。",
      notice: "本项目仅为个人爱好开发，代码开源。如有任何侵权行为，请联系本人删除。有问题提issue或私信机器人都ok。https://t.me/ddjdd_bot",
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
      tokenAuth: "disabled",
      environment: {
        nodeEnv: currentConfig.nodeEnv,
        runtime: currentConfig.runtime,
        tokenAuth: "disabled",
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
