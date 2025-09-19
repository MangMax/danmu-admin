/**
 * 获取日志信息端点
 * GET /api/logs
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  const timer = createTimer();

  try {
    logger.info('Fetching logs');

    // 获取日志缓冲区（这里需要从 danmu.js 的逻辑中获取）
    // 由于我们在 Nuxt 环境中，需要实现一个类似的日志系统
    const logBuffer = logger.getLogs ? logger.getLogs() : [];

    // 格式化日志输出
    const logText = logBuffer
      .map((log: any) =>
        `[${log.timestamp || new Date().toISOString()}] ${log.level}: ${formatLogMessage(log.message)}`
      )
      .join('\n');

    const responseTime = timer.end();
    logApiResponse('/api/logs', 200, responseTime);

    // 设置内容类型为纯文本
    setHeader(event, 'Content-Type', 'text/plain; charset=utf-8');

    return logText || 'No logs available';

  } catch (error: any) {
    logger.error('Failed to fetch logs:', error);
    const responseTime = timer.end();
    logApiResponse('/api/logs', 500, responseTime);

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch logs'
    });
  }
});
