/**
 * 缓存统计信息API
 * GET /api/cache/stats
 */

import { getCacheStats } from '../../utils/danmu-config';

export default defineEventHandler(async (_event) => {
  try {
    const stats = await getCacheStats();

    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get cache statistics'
    });
  }
});
