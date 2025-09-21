/**
 * 可选 Token 认证中间件
 * 处理跨域请求、可选的 Token 验证和请求日志
 * 默认不启用认证，只有设置了 NUXT_TOKEN 环境变量时才启用
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

  // 可选的 Token 验证逻辑
  await optionalTokenValidation(event, url);

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
 * 可选的 Token 验证函数
 * 如果未设置 token，则跳过验证；如果设置了 token，则进行验证
 */
async function optionalTokenValidation(event: any, url: URL) {
  try {
    // 检查是否启用了 token 认证
    const isTokenAuthEnabled = await config.isTokenAuthEnabled();

    // 如果未启用 token 认证，直接跳过
    if (!isTokenAuthEnabled) {
      logger.debug('Token authentication disabled, skipping validation', {
        path: url.pathname
      });
      return;
    }

    // 启用了 token 认证，执行验证逻辑
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
        providedToken: providedToken.substring(0, 4) + '***', // 只记录前4位用于调试
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

  } catch (error: any) {
    if (error.statusCode) {
      // 已经是 HTTP 错误，直接抛出
      throw error;
    }

    logger.error('Token validation error', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during authentication'
    });
  }
}
