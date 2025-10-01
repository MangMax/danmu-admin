/**
 * 弹幕获取路由器
 * 统一管理平台识别、URL处理和弹幕获取
 */

import useLogger from '~~/server/composables/useLogger';
import { utils } from '../string-utils';

// 导入各平台弹幕获取函数
import { fetchBilibili } from './bilibili/bilibili';
import { fetchIqiyi } from './iqiyi';
import { fetchTencentVideo } from './tencent';
import { fetchMangoTV } from './mango';
import { fetchYouku } from './youku';
import { fetchRenren } from './renren';
import { fetchHanjuTV } from './hanjutv';
import { fetchOtherServerWithRetry } from './other-server';

const logger = useLogger();

// 平台识别配置
export const PLATFORM_CONFIG = {
  bilibili: {
    domains: ['bilibili.com'],
    patterns: [/video\//, /bangumi\//],
    handler: fetchBilibili
  },
  iqiyi: {
    domains: ['iqiyi.com'],
    patterns: [/v_/],
    handler: fetchIqiyi
  },
  tencent: {
    domains: ['qq.com'],
    patterns: [/\/x\/cover\//, /\/x\/page\//],
    handler: fetchTencentVideo
  },
  mango: {
    domains: ['mgtv.com'],
    patterns: [/\/b\//],
    handler: fetchMangoTV
  },
  youku: {
    domains: ['youku.com'],
    patterns: [/v_show/, /video/],
    handler: fetchYouku
  },
  renren: {
    domains: [/^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/.*)?$/i],  // 人人视频使用特殊的ID格式
    patterns: [/^\d{6}$/],
    handler: fetchRenren
  },
  hanjutv: {
    domains: [/^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/.*)?$/i],
    patterns: [/^[a-zA-Z0-9]{21}$/],
    handler: fetchHanjuTV
  }
} as const;

export type PlatformName = keyof typeof PLATFORM_CONFIG;

/**
 * 智能平台识别
 * 基于URL特征识别视频平台
 */
export function identifyPlatform(url: string): PlatformName | null {
  try {
    // 首先检查是否为人人/hanjutv特殊ID（非标准URL）
    const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/.*)?$/i;
    if (!urlPattern.test(url)) {
      // 人人视频纯数字ID
      if (/^\d+$/.test(url)) {
        logger.info('Detected renren format:', url);
        return 'renren';
      } else {
        // hanjutv字符串ID
        logger.info('Detected hanjutv format:', url);
        return 'hanjutv';
      }
    }

    // 检查其他平台
    for (const [platform, config] of Object.entries(PLATFORM_CONFIG)) {
      // if (platform === 'renren' || platform === 'hanjutv') continue;

      // 检查域名匹配
      const domainMatch = config.domains.some(domain =>
        typeof domain === 'string' ? url.includes(domain) : domain.test(url)
      );

      if (!domainMatch) continue;

      // 检查URL模式匹配
      // if (config.patterns.length === 0) {
      //   return platform as PlatformName;
      // }

      const patternMatch = config.patterns.some(pattern => pattern.test(url));
      if (patternMatch) {
        return platform as PlatformName;
      }
    }

    logger.warn('Unknown platform for URL:', url);
    return null;
  } catch (error) {
    logger.error('Error identifying platform:', error);
    return null;
  }
}

/**
 * URL预处理
 * 标准化和转换特殊格式的URL
 */
export function preprocessUrl(url: string, platform?: PlatformName): string {
  try {
    // 验证URL格式
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: empty or non-string');
    }

    // 清理和标准化URL
    let processedUrl = url.trim();

    // 检测并处理优酷特殊格式
    if (platform === 'youku' || url.includes('youku.com/video?vid')) {
      processedUrl = utils.url.convertYoukuUrl(processedUrl);
      logger.info('Converted Youku URL:', processedUrl);
    }

    // 其他URL标准化处理
    if (utils.url.isValidUrl(processedUrl)) {
      processedUrl = utils.url.normalizeUrl(processedUrl);
    }

    return processedUrl;
  } catch (error) {
    logger.error('Error preprocessing URL:', error);
    return url; // 返回原始URL作为降级处理
  }
}

/**
 * 统一弹幕获取接口
 * 自动识别平台并调用对应的获取函数，失败时使用第三方服务器兜底
 */
export async function fetchDanmaku(url: string): Promise<{
  success: boolean;
  platform: PlatformName | null;
  data: DanmakuJson[];
  error?: string;
  fallbackUsed?: boolean;
}> {
  const startTime = Date.now();

  try {
    logger.info('开始获取弹幕:', url);

    // 验证输入
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    // 识别平台
    const platform = identifyPlatform(url);
    if (!platform) {
      throw new Error('Unsupported platform or invalid URL format');
    }

    logger.info('识别平台:', platform);

    // 预处理URL
    const processedUrl = preprocessUrl(url, platform);

    // 获取对应平台的处理函数
    const handler = PLATFORM_CONFIG[platform].handler;
    if (!handler) {
      throw new Error(`No handler found for platform: ${platform}`);
    }

    // 执行弹幕获取
    const danmakuData = await utils.performance.measureAsync(
      `fetch-${platform}`,
      () => handler(processedUrl)
    );

    const duration = Date.now() - startTime;

    // 检查是否获取到弹幕数据
    if (danmakuData && danmakuData.length > 0) {
      logger.info(`弹幕获取完成 [${platform}]: ${danmakuData.length}条, 耗时: ${duration}ms`);
      return {
        success: true,
        platform,
        data: danmakuData
      };
    } else {
      // 如果主平台没有获取到弹幕，尝试第三方服务器
      logger.warn(`平台 [${platform}] 未获取到弹幕，尝试第三方服务器兜底`);

      const fallbackData = await utils.performance.measureAsync(
        'fetch-fallback',
        () => fetchOtherServerWithRetry(processedUrl)
      );

      const totalDuration = Date.now() - startTime;

      if (fallbackData && fallbackData.length > 0) {
        logger.info(`第三方服务器兜底成功: ${fallbackData.length}条, 总耗时: ${totalDuration}ms`);
        return {
          success: true,
          platform,
          data: fallbackData,
          fallbackUsed: true
        };
      } else {
        logger.warn(`第三方服务器也未获取到弹幕, 总耗时: ${totalDuration}ms`);
        return {
          success: false,
          platform,
          data: [],
          error: 'No danmaku found from both primary platform and fallback server',
          fallbackUsed: true
        };
      }
    }

  } catch (error: any) {
    const _duration = Date.now() - startTime;
    const errorMessage = error?.message || 'Unknown error occurred';

    logger.error(`弹幕获取失败: ${errorMessage}, 尝试第三方服务器兜底`);

    // 主平台失败时，尝试第三方服务器兜底
    try {
      const fallbackData = await fetchOtherServerWithRetry(url);
      const totalDuration = Date.now() - startTime;

      if (fallbackData && fallbackData.length > 0) {
        logger.info(`第三方服务器兜底成功: ${fallbackData.length}条, 总耗时: ${totalDuration}ms`);
        return {
          success: true,
          platform: null,
          data: fallbackData,
          fallbackUsed: true
        };
      }
    } catch (fallbackError: any) {
      logger.error('第三方服务器兜底也失败了:', fallbackError?.message);
    }

    const _totalDuration = Date.now() - startTime;
    return {
      success: false,
      platform: null,
      data: [],
      error: errorMessage,
      fallbackUsed: true
    };
  }
}

/**
 * 批量弹幕获取
 * 支持多个URL的并发获取
 */
export async function fetchMultipleDanmaku(urls: string[]): Promise<{
  success: boolean;
  results: Array<{
    url: string;
    platform: PlatformName | null;
    data: DanmakuJson[];
    error?: string;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}> {
  const startTime = Date.now();

  try {
    logger.info('开始批量获取弹幕:', urls.length, '个URL');

    // 验证输入
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error('Invalid URLs array provided');
    }

    // 并发获取弹幕
    const promises = urls.map(async (url) => {
      const result = await fetchDanmaku(url);
      return {
        url,
        platform: result.platform,
        data: result.data,
        error: result.error
      };
    });

    const results = await Promise.all(promises);

    // 统计结果
    const successful = results.filter(r => !r.error).length;
    const failed = results.length - successful;
    const duration = Date.now() - startTime;

    logger.info(`批量弹幕获取完成: 成功 ${successful}, 失败 ${failed}, 耗时: ${duration}ms`);

    return {
      success: true,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        duration
      }
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`批量弹幕获取失败: ${error?.message}, 耗时: ${duration}ms`);

    return {
      success: false,
      results: [],
      summary: {
        total: 0,
        successful: 0,
        failed: urls.length,
        duration
      }
    };
  }
}

/**
 * 获取支持的平台列表
 */
export function getSupportedPlatforms(): Array<{
  name: PlatformName;
  domains: string[];
  description: string;
}> {
  return [
    {
      name: 'bilibili',
      domains: ['bilibili.com'],
      description: 'B站 - 支持普通投稿视频(av,bv)和番剧视频(ep)'
    },
    {
      name: 'iqiyi',
      domains: ['iqiyi.com'],
      description: '爱奇艺 - 支持电影、电视剧、综艺等'
    },
    {
      name: 'tencent',
      domains: ['qq.com'],
      description: '腾讯视频 - 支持电影、电视剧、综艺等'
    },
    {
      name: 'mango',
      domains: ['mgtv.com'],
      description: '芒果TV - 支持电影、电视剧、综艺等'
    },
    {
      name: 'youku',
      domains: ['youku.com'],
      description: '优酷 - 支持电影、电视剧、综艺等'
    },
    {
      name: 'renren',
      domains: [],
      description: '人人视频 - 支持海外影视资源'
    }
  ];
}

// 导出便捷函数
export const CommentRouter = {
  identifyPlatform,
  preprocessUrl,
  fetchDanmaku,
  fetchMultipleDanmaku,
  getSupportedPlatforms
};

export default CommentRouter;
