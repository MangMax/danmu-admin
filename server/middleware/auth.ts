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
 * /api/v2 接口：密码认证优先，没有密码认证时可以使用令牌认证
 * 其他接口：只要密码认证通过就行，与令牌无关
 */
async function performAuthentication(event: any, url: URL) {
  try {
    const isPasswordAuthEnabled = await config.isPasswordAuthEnabled();
    const isTokenAuthEnabled = await config.isTokenAuthEnabled();
    const isV2Api = url.pathname.includes('/api/v2');

    // 如果两种认证都未启用，直接通过
    if (!isPasswordAuthEnabled && !isTokenAuthEnabled) {
      logger.debug('No authentication required', { path: url.pathname });
      return;
    }

    // 检查密码认证状态
    let hasValidSession = false;
    if (isPasswordAuthEnabled) {
      const session = await getUserSession(event);
      hasValidSession = !!session?.user;

      if (hasValidSession) {
        logger.debug('Password authentication successful', {
          username: session.user?.username,
          path: url.pathname
        });
      }
    }

    // 处理 /api/v2 接口的认证逻辑
    if (isV2Api) {
      // 对于 v2 接口：如果有密码认证且已登录，直接通过
      if (isPasswordAuthEnabled && hasValidSession) {
        return;
      }

      // 如果没有密码认证或未登录，但开启了令牌认证，则检查令牌
      if (isTokenAuthEnabled) {
        await validateTokenAuth(event, url);
        return;
      }

      // 如果开启了密码认证但未登录，且没有令牌认证，则拒绝访问
      if (isPasswordAuthEnabled && !hasValidSession) {
        logger.warn('V2 API access denied: password auth enabled but no session found', {
          url: url.pathname
        });
        throw createError({
          statusCode: 401,
          statusMessage: 'Authentication required'
        });
      }
    } else {
      // 处理其他接口的认证逻辑：只检查密码认证
      if (isPasswordAuthEnabled) {
        if (!hasValidSession) {
          logger.warn('Password auth required but no session found', {
            url: url.pathname
          });
          throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
          });
        }
        // 密码认证通过，直接返回，不检查令牌
        return;
      }

      // 如果没有开启密码认证但开启了令牌认证，则检查令牌
      if (isTokenAuthEnabled) {
        await validateTokenAuth(event, url);
        return;
      }
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
