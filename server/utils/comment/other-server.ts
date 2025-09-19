/**
 * 第三方弹幕服务器兜底机制
 * 当主要平台弹幕获取失败时，作为备选方案
 */

import useLogger from '~~/server/composables/useLogger';
import { config } from '../env-config';
import convertToDanmakuJson from '../convertToDanmakuJson';

const logger = useLogger();

/**
 * 从第三方服务器获取弹幕
 * 作为兜底机制使用
 */
export async function fetchOtherServer(inputUrl: string): Promise<DanmakuJson[]> {
  const envConfig = await config.get();

  try {
    logger.info('开始请求第三方弹幕服务器:', envConfig.otherServer);

    // 构建请求URL
    const requestUrl = `${envConfig.otherServer}/?url=${encodeURIComponent(inputUrl)}&ac=dm`;

    const response = await $fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: envConfig.requestTimeout,
    });

    logger.info(`第三方服务器响应 from ${envConfig.otherServer}:`);

    // 记录响应的前200个字符用于调试
    const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
    logger.info(responseStr.slice(0, 200));

    // 转换为标准弹幕格式
    const danmakuData = convertToDanmakuJson(response as any, "other_server");

    logger.info(`第三方服务器弹幕获取成功: ${danmakuData.length}条`);
    return danmakuData;

  } catch (error: any) {
    logger.error(`请求第三方服务器 ${envConfig.otherServer} 失败:`, error?.message || error);
    return [];
  }
}

/**
 * 检查第三方服务器健康状态
 */
export async function checkOtherServerHealth(): Promise<{
  available: boolean;
  responseTime: number;
  error?: string;
}> {
  const envConfig = await config.get();
  const startTime = Date.now();

  try {
    // 使用一个简单的测试URL来检查服务器状态
    const testUrl = `${envConfig.otherServer}/`;

    await $fetch(testUrl, {
      method: 'HEAD',
      timeout: 5000, // 5秒超时
    });

    const responseTime = Date.now() - startTime;

    logger.info(`第三方服务器健康检查通过, 响应时间: ${responseTime}ms`);

    return {
      available: true,
      responseTime
    };

  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error?.message || 'Unknown error';

    logger.warn(`第三方服务器健康检查失败: ${errorMessage}, 耗时: ${responseTime}ms`);

    return {
      available: false,
      responseTime,
      error: errorMessage
    };
  }
}

/**
 * 带重试机制的第三方服务器请求
 */
export async function fetchOtherServerWithRetry(
  inputUrl: string,
  maxRetries: number = 3
): Promise<DanmakuJson[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`第三方服务器请求尝试 ${attempt}/${maxRetries}`);

      const result = await fetchOtherServer(inputUrl);

      if (result.length > 0) {
        logger.info(`第三方服务器请求成功 (尝试 ${attempt}/${maxRetries}): ${result.length}条弹幕`);
        return result;
      }

      // 如果返回空结果，也算作一种失败情况
      if (attempt < maxRetries) {
        logger.warn(`第三方服务器返回空结果，将重试 (${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 递增延迟
      }

    } catch (error: any) {
      lastError = error;
      logger.warn(`第三方服务器请求失败 (尝试 ${attempt}/${maxRetries}):`, error?.message);

      if (attempt < maxRetries) {
        // 递增延迟重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  logger.error(`第三方服务器请求最终失败，已尝试 ${maxRetries} 次:`, lastError?.message);
  return [];
}

export default {
  fetchOtherServer,
  checkOtherServerHealth,
  fetchOtherServerWithRetry
};
