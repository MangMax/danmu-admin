/**
 * 全局错误处理中间件
 * 统一处理 API 错误响应格式
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  try {
    // 继续处理请求
    return;
  } catch (error: any) {
    const url = new URL(event.node.req.url || '', 'http://localhost');
    const method = event.node.req.method || 'GET';

    logger.error('Global error handler caught error:', {
      path: url.pathname,
      method,
      error: error.message,
      stack: error.stack,
      statusCode: error.statusCode
    });

    // 确定错误状态码
    let statusCode = error.statusCode || error.status || 500;
    let errorMessage = error.message || 'Internal Server Error';

    // 根据错误类型设置适当的状态码
    if (error.name === 'ValidationError') {
      statusCode = 400;
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
    } else if (error.name === 'ForbiddenError') {
      statusCode = 403;
    } else if (error.name === 'NotFoundError') {
      statusCode = 404;
    } else if (error.name === 'TimeoutError') {
      statusCode = 408;
    } else if (error.name === 'RateLimitError') {
      statusCode = 429;
    }

    // 在生产环境中隐藏详细错误信息
    const isProduction = config.isProduction();
    if (isProduction && statusCode === 500) {
      errorMessage = 'Internal Server Error';
    }

    // 记录 API 响应
    logApiResponse(url.pathname, statusCode);

    // 设置响应状态
    setResponseStatus(event, statusCode);

    // 设置响应头
    setHeader(event, 'Content-Type', 'application/json');

    // 返回统一的错误响应格式
    return createErrorResponse(statusCode, errorMessage);
  }
});
