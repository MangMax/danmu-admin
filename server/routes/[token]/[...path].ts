/**
 * Token 路径处理器
 * 处理格式如 /12345666/api/v2/match 的请求
 * 重定向到 /api/v2/match?token=12345666
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  try {
    // 获取路径参数
    const token = getRouterParam(event, 'token');
    const pathArray = getRouterParam(event, 'path');

    if (!token || !pathArray) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Invalid path structure'
      });
    }

    // 解析路径
    const pathParts = Array.isArray(pathArray) ? pathArray : pathArray.split('/').filter(Boolean);

    // 检查是否是 API 路径：token/api/v2/...
    if (pathParts.length >= 2 && pathParts[0] === 'api' && pathParts[1] === 'v2') {
      const actualApiPath = '/' + pathParts.join('/');

      logger.info('Token route redirect', {
        originalPath: `/${token}${actualApiPath}`,
        token: token.substring(0, 4) + '***',
        actualPath: actualApiPath
      });

      // 获取现有的查询参数
      const query = getQuery(event);

      // 构建新的查询参数（添加 token）
      const searchParams = new URLSearchParams();

      // 添加现有查询参数
      Object.entries(query).forEach(([key, value]) => {
        if (key !== 'token' && value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      // 添加 token 参数
      searchParams.append('token', token);

      // 构建重定向 URL
      const queryString = searchParams.toString();
      const redirectUrl = queryString ? `${actualApiPath}?${queryString}` : actualApiPath;

      logger.info('Redirecting to', {
        from: `/${token}${actualApiPath}`,
        to: redirectUrl
      });

      // 执行重定向
      return sendRedirect(event, redirectUrl, 302);

    } else {
      // 不是 API 路径，返回 404
      logger.warn('Invalid token path format', {
        token: token.substring(0, 4) + '***',
        path: pathParts.join('/')
      });

      throw createError({
        statusCode: 404,
        statusMessage: 'Invalid API path format'
      });
    }

  } catch (error: any) {
    logger.error('Token route handler error:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error in token route'
    });
  }
});
