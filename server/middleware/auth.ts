/**
 * CORS 中间件
 * 处理跨域请求和基本的请求日志
 * Token 认证已禁用
 */

import useLogger from '~~/server/composables/useLogger';

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

  // 记录 API 请求 (不再需要 token 验证)
  logApiRequest(event, url.pathname);

  logger.debug('Request processed', {
    path: url.pathname,
    method,
    ip: event.node.req.headers['x-forwarded-for'] ||
      event.node.req.headers['x-real-ip'] ||
      event.node.req.connection?.remoteAddress || 'Unknown'
  });
});
