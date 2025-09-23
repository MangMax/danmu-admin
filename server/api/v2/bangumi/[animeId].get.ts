/**
 * 获取番剧详情端点
 * GET /api/v2/bangumi/[animeId]
 */

import useLogger from '~~/server/composables/useLogger';
import { getBangumiResponse } from '~~/server/utils/bangumi-utils';

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

    // 使用工具函数获取番剧详情
    const result = await getBangumiResponse(animeId!);

    const responseTime = timer.end();
    logApiResponse(`/api/v2/bangumi/${animeId}`, 200, responseTime);

    return result;

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
