/**
 * 获取当前用户信息 API 端点
 * 返回当前登录用户的信息
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  try {
    // 获取当前会话
    const session = await getUserSession(event);

    if (!session?.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Not authenticated'
      });
    }

    logger.debug('User info requested', { username: session.user.username });

    return {
      success: true,
      user: {
        username: session.user.username,
        loginTime: session.user.loginTime
      }
    };

  } catch (error: any) {
    logger.error('Failed to get user info:', error);

    // 如果是我们创建的错误，直接抛出
    if (error.statusCode) {
      throw error;
    }

    // 其他错误
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});
