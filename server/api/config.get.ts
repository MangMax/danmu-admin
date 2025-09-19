/**
 * 配置信息API
 * GET /api/config
 */

import { getDanmuConfig } from '../utils/danmu-config';

export default defineEventHandler(async (_event) => {
  try {
    const config = await getDanmuConfig();

    // 返回安全的配置信息（不包含敏感信息）
    return {
      version: config.version,
      allowedPlatforms: config.allowedPlatforms,
      runtime: config.runtime,
      nodeEnv: config.nodeEnv,
      maxLogs: config.maxLogs,
      maxAnimes: config.maxAnimes,
      requestTimeout: config.requestTimeout,
      maxRetryCount: config.maxRetryCount,
      tokenAuth: "disabled",
      hasCustomOtherServer: config.otherServer !== "https://api.danmu.icu",
      hasCustomVodServer: config.vodServer !== "https://www.caiji.cyou"
    };
  } catch (error) {
    console.error('Failed to load configuration:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load configuration'
    });
  }
});
