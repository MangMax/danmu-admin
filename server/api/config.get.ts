/**
 * 配置信息接口
 * 返回系统配置和调试信息
 */

import { config } from '~~/server/utils/env-config';
import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (_event) => {
  try {
    logger.info('Fetching system configuration');

    // 获取调试信息
    const debugInfo = await config.getDebugInfo();

    // 获取生产环境优化配置
    const optimizations = await config.getProductionOptimizations();

    // 获取当前配置（隐藏敏感信息）
    const currentConfig = await config.get();
    const isTokenAuthEnabled = await config.isTokenAuthEnabled();

    const safeConfig = {
      version: currentConfig.version,
      runtime: currentConfig.runtime,
      nodeEnv: currentConfig.nodeEnv,
      allowedPlatforms: currentConfig.allowedPlatforms,
      maxLogs: currentConfig.maxLogs,
      maxAnimes: currentConfig.maxAnimes,
      requestTimeout: currentConfig.requestTimeout,
      maxRetryCount: currentConfig.maxRetryCount,
      youkuConcurrency: currentConfig.youkuConcurrency,
      // Token 认证状态
      tokenAuthEnabled: isTokenAuthEnabled,
      hasToken: !!currentConfig.token,
      tokenLength: currentConfig.token?.length || 0,
      // 服务器配置
      hasOtherServer: !!currentConfig.otherServer,
      hasVodServer: !!currentConfig.vodServer,
      hasBilibiliCookie: !!currentConfig.bilibiliCookie,
      bilibiliCookieLength: currentConfig.bilibiliCookie?.length || 0
    };

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      config: safeConfig,
      debug: debugInfo,
      optimizations,
      environment: {
        platform: process.platform || 'unknown',
        nodeVersion: process.version || 'unknown',
        arch: process.arch || 'unknown',
        uptime: process.uptime ? Math.floor(process.uptime()) : 0
      }
    };

    logger.debug('Configuration retrieved successfully', {
      runtime: currentConfig.runtime,
      hasCustomToken: currentConfig.token !== "87654321"
    });

    return response;
  } catch (error: any) {
    logger.error('Failed to get configuration:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve configuration',
      data: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});