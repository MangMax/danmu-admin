/**
 * 获取弹幕端点
 * GET /api/v2/comment/[commentId]
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  const timer = createTimer();

  try {
    // 获取路径参数
    const pathParams = getPathParams(event);
    const commentIdStr = pathParams.commentId;

    // 验证 commentId 参数
    const { isValid, value: commentId, error } = validateNumericParam(commentIdStr, 'commentId');
    if (!isValid) {
      logger.warn('Invalid commentId parameter:', error);
      const responseTime = timer.end();
      logApiResponse(`/api/v2/comment/${commentIdStr}`, 400, responseTime);

      throw createError({
        statusCode: 400,
        statusMessage: error
      });
    }

    logger.info(`Fetching danmaku for commentId: ${commentId}`);

    // 根据 commentId 查找对应的 URL
    const url = findUrlById(commentId!);
    if (!url) {
      logger.warn(`Comment with ID ${commentId} not found`);
      const responseTime = timer.end();
      logApiResponse(`/api/v2/comment/${commentId}`, 404, responseTime);

      // 返回空的弹幕响应而不是抛出错误，保持与原始 danmu.js 的一致性
      return createCommentResponse([], 'No URL found for the given comment ID');
    }

    logger.info(`Found URL for commentId ${commentId}: ${url}`);

    // 获取弹幕数据
    const result = await fetchDanmaku(url);

    if (result.success) {
      const responseTime = timer.end();
      logger.info(`Successfully fetched ${result.data.length} danmaku from ${result.platform}${result.fallbackUsed ? ' (fallback used)' : ''}`);
      logApiResponse(`/api/v2/comment/${commentId}`, 200, responseTime);

      return createCommentResponse(
        result.data,
        `Found ${result.data.length} danmaku from ${result.platform}${result.fallbackUsed ? ' (fallback)' : ''}`
      );
    } else {
      const responseTime = timer.end();
      logger.warn(`Failed to fetch danmaku: ${result.error}`);
      logApiResponse(`/api/v2/comment/${commentId}`, 200, responseTime); // 仍然返回 200，只是没有弹幕

      return createCommentResponse([], result.error || 'Failed to fetch danmaku');
    }

  } catch (error: any) {
    logger.error('Get comment failed:', error);
    const responseTime = timer.end();
    const pathParams = getPathParams(event);
    logApiResponse(`/api/v2/comment/${pathParams.commentId || 'unknown'}`, error.statusCode || 500, responseTime);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during danmaku fetch'
    });
  }
});
