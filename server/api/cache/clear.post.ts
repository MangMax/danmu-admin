/**
 * 清空缓存API
 * POST /api/cache/clear
 */

import { clearAllCache, log } from '../../utils/danmu-config';

export default defineEventHandler(async (_event) => {
  try {
    const success = await clearAllCache();

    if (success) {
      log('info', 'Cache cleared via API');
      return {
        success: true,
        message: 'All caches cleared successfully',
        timestamp: new Date().toISOString()
      };
    } else {
      throw new Error('Failed to clear caches');
    }
  } catch (error) {
    console.error('Failed to clear caches:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to clear caches'
    });
  }
});
