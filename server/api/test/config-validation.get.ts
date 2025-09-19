/**
 * 配置验证测试API
 * GET /api/test/config-validation
 */

import {
  getDanmuConfig,
  getOtherServer,
  getVodServer,
  getAllowedPlatforms
} from '../../utils/danmu-config';

export default defineEventHandler(async (_event) => {
  try {
    // 测试各种配置获取方法
    const results = {
      fullConfig: await getDanmuConfig(),
      otherServer: await getOtherServer(),
      vodServer: await getVodServer(),
      allowedPlatforms: await getAllowedPlatforms(),
      tokenAuth: 'disabled',
      testStatus: 'success',
      timestamp: new Date().toISOString()
    };

    return {
      success: true,
      message: 'Configuration validation successful (Token auth disabled)',
      data: results
    };
  } catch (error) {
    console.error('Configuration validation failed:', error);

    return {
      success: false,
      message: 'Configuration validation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
});
