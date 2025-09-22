/**
 * 配置信息接口
 * 返回系统配置和调试信息
 */

import { config } from '~~/server/utils/env-config';
import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (_event) => {
  try {
    const { authUsername, authPassword } = useRuntimeConfig();
    logger.info('Fetching system configuration');
    logger.info('Password auth enabled:', {
      authUsername: authUsername,
      authPassword: authPassword
    });

    // 获取当前配置
    const currentConfig = await config.get();
    const isTokenAuthEnabled = await config.isTokenAuthEnabled();
    const isPasswordAuthEnabled = await config.isPasswordAuthEnabled();

    // 返回扁平结构，与前端期望的格式一致
    const response = {
      version: currentConfig.version,
      runtime: currentConfig.runtime,
      nodeEnv: currentConfig.nodeEnv,
      allowedPlatforms: currentConfig.allowedPlatforms,
      maxLogs: currentConfig.maxLogs,
      maxAnimes: currentConfig.maxAnimes,
      requestTimeout: currentConfig.requestTimeout,
      maxRetryCount: currentConfig.maxRetryCount,
      youkuConcurrency: currentConfig.youkuConcurrency,
      // 认证状态 - 适配前端显示
      tokenAuth: isTokenAuthEnabled ? "enabled" : "disabled",
      passwordAuth: isPasswordAuthEnabled ? "enabled" : "disabled",
      // 服务器配置状态
      hasCustomOtherServer: currentConfig.otherServer !== "https://api.danmu.icu",
      hasCustomVodServer: currentConfig.vodServer !== "https://www.caiji.cyou",
      hasBilibiliCookie: !!currentConfig.bilibiliCookie
    };

    logger.debug('Configuration retrieved successfully', {
      runtime: currentConfig.runtime,
      tokenAuth: response.tokenAuth
    });

    return response;
  } catch (error: any) {
    logger.error('Failed to get configuration:', error);

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve configuration'
    });
  }
});