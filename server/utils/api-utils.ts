/**
 * API 工具函数
 * 提供通用的 API 响应处理、错误处理和验证功能
 */

// import { config } from './env-config'; // 不再需要
import useLogger from '~~/server/composables/useLogger';
import type { AnimeSearchResult } from '~~/shared/types/search';
import type { ApiAnimeInfo, SearchAnimeResponse } from '~~/shared/types/api';

const logger = useLogger();

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T, _message = ''): ApiResponse<T> {
  return {
    errorCode: 0,
    success: true,
    errorMessage: "",
    data
  };
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  errorCode: number,
  message: string,
  _statusCode = 400
): ErrorResponse {
  logger.error(`API Error ${errorCode}: ${message}`);

  return {
    errorCode,
    success: false,
    errorMessage: message,
    data: null
  };
}

/**
 * 将内部搜索结果转换为 API 响应格式
 * 基于原始 danmu.js 的转换逻辑
 */
export function convertToApiAnimeInfo(searchResult: AnimeSearchResult): ApiAnimeInfo {
  return {
    animeId: searchResult.animeId,
    bangumiId: searchResult.bangumiId,
    animeTitle: searchResult.animeTitle,
    type: searchResult.type,
    typeDescription: searchResult.typeDescription,
    imageUrl: searchResult.imageUrl,
    startDate: searchResult.startDate,
    episodeCount: searchResult.episodeCount,
    rating: searchResult.rating,
    isFavorited: searchResult.isFavorited
  };
}

/**
 * 创建搜索动漫响应
 */
export function createSearchAnimeResponse(
  animes: AnimeSearchResult[],
  message = ''
): SearchAnimeResponse {
  // 转换为 API 格式（移除 provider 和 links）
  const apiAnimes = animes.map(convertToApiAnimeInfo);

  return {
    errorCode: 0,
    success: true,
    errorMessage: message,
    animes: apiAnimes
  };
}

/**
 * 创建匹配响应
 */
export function createMatchResponse(
  isMatched: boolean,
  matches: any[] = [],
  message = ''
): MatchResponse {
  return {
    errorCode: 0,
    success: true,
    errorMessage: message,
    isMatched,
    matches
  };
}

/**
 * 创建番剧响应
 */
export function createBangumiResponse(
  bangumi: any,
  message = ''
): BangumiResponse {
  return {
    errorCode: 0,
    success: true,
    errorMessage: message,
    bangumi
  };
}

/**
 * 创建弹幕响应
 */
export function createCommentResponse(
  comments: any[],
  _message = ''
): CommentResponse {
  return {
    count: comments.length,
    comments
  };
}

/**
 * Token 验证函数已禁用
 * 保留函数签名以维持兼容性，但总是返回 true
 */
export async function validateToken(_event?: any, _env?: any): Promise<boolean> {
  // Token 验证已禁用，总是返回 true
  return true;
}

/**
 * 路径处理函数已简化
 * 不再移除 token 部分，直接返回原路径
 */
export async function removeTokenFromPath(path: string, _env?: any): Promise<string> {
  // 不再处理 token，直接返回原路径
  return path;
}

/**
 * 获取查询参数
 */
export function getQueryParams(event: any): Record<string, string> {
  const url = new URL(event.node.req.url || '', 'http://localhost');
  const params: Record<string, string> = {};

  url.searchParams.forEach((value: string, key: string) => {
    params[key] = value;
  });

  return params;
}

/**
 * 获取路径参数
 */
export function getPathParams(event: any): Record<string, string> {
  return getRouterParams(event) || {};
}

/**
 * 验证必需的查询参数
 */
export function validateRequiredParams(
  params: Record<string, string>,
  required: string[]
): { isValid: boolean; missing: string[] } {
  const missing = required.filter(param => !params[param] || params[param].trim() === '');

  return {
    isValid: missing.length === 0,
    missing
  };
}

/**
 * 安全的 JSON 解析
 */
export async function safeParseJSON(event: any): Promise<any> {
  try {
    const body = await readBody(event);
    return body;
  } catch (error) {
    logger.error('JSON parse error:', error);
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid JSON body'
    });
  }
}

/**
 * 处理异步错误
 */
export function handleAsyncError(error: any): ErrorResponse {
  logger.error('Async operation failed:', error);

  if (error.statusCode) {
    return createErrorResponse(error.statusCode, error.message || 'Unknown error');
  }

  return createErrorResponse(500, 'Internal server error');
}

/**
 * 验证数字参数
 */
export function validateNumericParam(
  value: string | undefined,
  paramName: string
): { isValid: boolean; value?: number; error?: string } {
  if (!value) {
    return {
      isValid: false,
      error: `${paramName} is required`
    };
  }

  const numValue = parseInt(value, 10);
  if (isNaN(numValue)) {
    return {
      isValid: false,
      error: `${paramName} must be a valid number`
    };
  }

  return {
    isValid: true,
    value: numValue
  };
}

/**
 * 记录 API 请求
 */
export function logApiRequest(event: any, endpoint: string): void {
  const url = new URL(event.node.req.url || '', 'http://localhost');
  const method = event.node.req.method || 'GET';
  const userAgent = event.node.req.headers['user-agent'] || 'Unknown';
  const ip = event.node.req.headers['x-forwarded-for'] ||
    event.node.req.headers['x-real-ip'] ||
    event.node.req.connection?.remoteAddress || 'Unknown';

  logger.info(`API Request: ${method} ${endpoint}`, {
    originalPath: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    userAgent,
    ip,
    timestamp: new Date().toISOString()
  });
}

/**
 * 记录 API 响应
 */
export function logApiResponse(
  endpoint: string,
  statusCode: number,
  responseTime?: number
): void {
  logger.info(`API Response: ${endpoint}`, {
    statusCode,
    responseTime: responseTime ? `${responseTime}ms` : undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * 创建性能计时器
 */
export function createTimer(): { end: () => number } {
  const start = Date.now();

  return {
    end: () => Date.now() - start
  };
}

/**
 * 中文数字转换
 */
export function convertChineseNumber(chineseNumber: string): number {
  // 如果是阿拉伯数字，直接转换
  if (/^\d+$/.test(chineseNumber)) {
    return Number(chineseNumber);
  }

  // 中文数字映射（简体+繁体）
  const digits: Record<string, number> = {
    // 简体
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9,
    // 繁体
    '壹': 1, '貳': 2, '參': 3, '肆': 4, '伍': 5,
    '陸': 6, '柒': 7, '捌': 8, '玖': 9
  };

  // 单位映射（简体+繁体）
  const units: Record<string, number> = {
    // 简体
    '十': 10, '百': 100, '千': 1000,
    // 繁体
    '拾': 10, '佰': 100, '仟': 1000
  };

  let result = 0;
  let current = 0;
  let lastUnit = 1;

  for (let i = 0; i < chineseNumber.length; i++) {
    const char = chineseNumber[i];

    if (digits[char] !== undefined) {
      // 数字
      current = digits[char];
    } else if (units[char] !== undefined) {
      // 单位
      const unit = units[char];

      if (current === 0) current = 1;

      if (unit >= lastUnit) {
        // 更大的单位，重置结果
        result = current * unit;
      } else {
        // 更小的单位，累加到结果
        result += current * unit;
      }

      lastUnit = unit;
      current = 0;
    }
  }

  // 处理最后的个位数
  if (current > 0) {
    result += current;
  }

  return result;
}

/**
 * 季度匹配逻辑
 */
export function matchSeason(anime: any, queryTitle: string, season: number): boolean {
  if (anime.animeTitle.includes(queryTitle)) {
    const title = anime.animeTitle.split("(")[0].trim();
    if (title.startsWith(queryTitle)) {
      const afterTitle = title.substring(queryTitle.length).trim();
      if (afterTitle === '' && season === 1) {
        return true;
      }
      // match number from afterTitle
      const seasonIndex = afterTitle.match(/\d+/);
      if (seasonIndex && seasonIndex[0] === season.toString()) {
        return true;
      }
      // match chinese number
      const chineseNumber = afterTitle.match(/[一二三四五六七八九十壹贰叁肆伍陆柒捌玖拾]+/);
      if (chineseNumber && convertChineseNumber(chineseNumber[0]) === season) {
        return true;
      }
    }
    return false;
  } else {
    return false;
  }
}

/**
 * 格式化日志消息
 */
export function formatLogMessage(message: string): string {
  try {
    const parsed = JSON.parse(message);
    return JSON.stringify(parsed, null, 2).replace(/\n/g, "\n    ");
  } catch {
    return message;
  }
}

/**
 * 设置 CORS 头
 */
export function setCorsHeaders(event: any): void {
  setHeader(event, 'Access-Control-Allow-Origin', '*');
  setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization');
  setHeader(event, 'Access-Control-Max-Age', 86400);
}

/**
 * 处理预检请求
 */
export function handleOptionsRequest(event: any): void {
  setCorsHeaders(event);
  setResponseStatus(event, 204);
  return;
}
