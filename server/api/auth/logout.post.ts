/**
 * 登出 API 端点
 * 清除用户会话
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  try {
    // 清除会话
    await clearUserSession(event);

    logger.info('User logged out successfully');

    return {
      success: true,
      message: 'Logout successful'
    };

  } catch (error: any) {
    logger.error('Logout failed:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});
