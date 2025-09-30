/**
 * Token 路径处理器
 * 支持格式如 /12345666/api/v2/match 和 /12345666/match 的请求
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

    if (pathParts.length === 0) {
      logger.warn('Invalid token path format', {
        token: token.substring(0, 4) + '***',
        reason: 'Missing path segments'
      });

      throw createError({
        statusCode: 404,
        statusMessage: 'Invalid API path format'
      });
    }

    const isApiV2Path = pathParts.length >= 2 && pathParts[0] === 'api' && pathParts[1] === 'v2';
    let actualApiPath: string | null = null;
    let redirectType: 'prefixed' | 'short' | null = null;

    if (isApiV2Path) {
      actualApiPath = '/' + pathParts.join('/');
      redirectType = 'prefixed';
    } else if (pathParts[0] !== 'api') {
      actualApiPath = '/api/v2/' + pathParts.join('/');
      redirectType = 'short';
    }

    if (actualApiPath) {
      const originalPath = '/' + [token, ...pathParts].join('/');

      logger.info('Token route redirect', {
        originalPath,
        token: token.substring(0, 4) + '***',
        actualPath: actualApiPath,
        redirectType
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
        from: originalPath,
        to: redirectUrl
      });

      // 执行重定向
      return sendRedirect(event, redirectUrl, 302);
    } else {
      // 不是 API 路径，返回 404
      logger.warn('Invalid token path format', {
        token: token.substring(0, 4) + '***',
        path: pathParts.join('/'),
        reason: 'Unsupported API prefix'
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
