/**
 * 统一认证中间件
 * 处理 CORS、Token 认证、密码认证和请求日志
 */

import useLogger from '~~/server/composables/useLogger';
import { config } from '~~/server/utils/env-config';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  const url = new URL(event.node.req.url || '', 'http://localhost');
  const method = event.node.req.method || 'GET';

  // 跳过非 API 路径和静态资源
  if (!url.pathname.startsWith('/api') &&
    !url.pathname.includes('/logs') &&
    url.pathname !== '/' &&
    !url.pathname.includes('/favicon.ico') &&
    !url.pathname.includes('/robots.txt')) {
    return;
  }

  // 处理 CORS 预检请求
  if (method === 'OPTIONS') {
    setHeader(event, 'Access-Control-Allow-Origin', '*');
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization');
    setHeader(event, 'Access-Control-Max-Age', 86400);
    setResponseStatus(event, 204);
    return;
  }

  // 设置 CORS 头
  setHeader(event, 'Access-Control-Allow-Origin', '*');
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 跳过认证相关的路由
  if (url.pathname.startsWith('/api/auth/') || url.pathname.startsWith('/api/config')) {
    logger.debug('Skipping auth for auth/config routes', { path: url.pathname });
    return;
  }

  // 执行认证检查
  await performAuthentication(event, url);

  // 记录 API 请求
  logApiRequest(event, url.pathname);

  logger.debug('Request processed', {
    path: url.pathname,
    method,
    ip: event.node.req.headers['x-forwarded-for'] ||
      event.node.req.headers['x-real-ip'] ||
      event.node.req.connection?.remoteAddress || 'Unknown'
  });
});

/**
 * 执行认证检查
 * 优先检查密码认证，然后检查 Token 认证
 */
async function performAuthentication(event: any, url: URL) {
  try {

    const isTokenAuthEnabled = await config.isTokenAuthEnabled();

    // 1. 检查密码认证
    const isPasswordAuthEnabled = await config.isPasswordAuthEnabled();
    if (isPasswordAuthEnabled) {
      const session = await getUserSession(event);

      if (!session?.user && !url.pathname.includes('/api/v2')) {
        logger.warn('Password auth required but no session found', {
          url: url.pathname
        });

        throw createError({
          statusCode: 401,
          statusMessage: 'Authentication required'
        });
      } else if (url.pathname.includes('/api/v2') && isTokenAuthEnabled) {
        await validateTokenAuth(event, url);
      }

      logger.debug('Password authentication successful', {
        username: session.user?.username,
        path: url.pathname
      });

      return; // 密码认证成功，不需要检查 Token
    }

    // 2. 检查 Token 认证
    if (isTokenAuthEnabled) {
      await validateTokenAuth(event, url);
    }

    // 3. 如果两种认证都未启用，直接通过
    if (!isPasswordAuthEnabled && !isTokenAuthEnabled) {
      logger.debug('No authentication required', { path: url.pathname });
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }

    logger.error('Authentication error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Authentication check failed'
    });
  }
}

/**
 * Token 认证验证
 */
async function validateTokenAuth(event: any, url: URL) {
  const expectedToken = await config.getToken();

  // 根路径处理 - 允许无 token 访问首页
  if (url.pathname === '/') {
    return;
  }

  // favicon 和 robots.txt 跳过验证
  if (url.pathname === '/favicon.ico' || url.pathname === '/robots.txt') {
    return;
  }

  // 解析路径中的 token
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts.length < 1) {
    logger.error('Invalid path structure when token auth is enabled', { path: url.pathname });
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid path - token required'
    });
  }

  // 第一个路径段应该是 token
  const providedToken = pathParts[0];

  if (providedToken !== expectedToken) {
    logger.error('Invalid token provided', {
      path: url.pathname,
      providedToken: providedToken.substring(0, 4) + '***',
      ip: event.node.req.headers['x-forwarded-for'] ||
        event.node.req.headers['x-real-ip'] ||
        event.node.req.connection?.remoteAddress || 'Unknown'
    });

    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Invalid token'
    });
  }

  // 验证成功，重写 URL 去掉 token 部分
  const newPath = '/' + pathParts.slice(1).join('/');
  event.node.req.url = newPath + (url.search || '');

  logger.debug('Token validation successful', {
    originalPath: url.pathname,
    newPath: newPath,
    tokenLength: expectedToken.length
  });
}

/**
 * 记录 API 请求日志
 */
function logApiRequest(event: any, pathname: string) {
  // 这里可以添加请求日志记录逻辑
  logger.debug('API request logged', { path: pathname });
}
