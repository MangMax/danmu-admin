/**
 * 字符串处理和工具函数模块
 * 基于 es-toolkit 构建，只包含特定业务逻辑
 * 通用工具直接使用 es-toolkit 提供的函数
 */

import useLogger from '~~/server/composables/useLogger';

// 直接从 es-toolkit 导出常用工具，供其他模块使用
export {
  // Array utilities
  chunk,
  uniq,
  difference,
  intersection,
  union,

  // Object utilities
  pick,
  omit,
  merge,
  isEqual,
  isNil,
  cloneDeep,

  // String utilities
  camelCase,
  snakeCase,
  kebabCase,
  pascalCase,
  trim,
  trimStart,
  trimEnd,
  capitalize,
  upperFirst,
  lowerFirst,
  escape,

  // Function utilities
  debounce,
  throttle,
  identity,
  noop,
  memoize,

  // Math utilities
  clamp,
  sum,
  mean,
  random,
  inRange,

  // Predicate utilities - 使用兼容层
  // isEmpty, isArray, isString, isNumber, isObject 在 compat 版本中可用
} from 'es-toolkit';

const logger = useLogger();

/**
 * URL 处理工具 - 业务特定逻辑
 */
export class UrlUtils {
  /**
   * 优酷 URL 格式转换
   * 将 https://v.youku.com/video?vid=XNjQ4MTIwOTE2NA== 
   * 转换为 https://v.youku.com/v_show/id_XNjQ4MTIwOTE2NA==.html
   */
  static convertYoukuUrl(url: string): string {
    try {
      if (!url.includes('youku.com/video?vid')) {
        return url;
      }

      const vidMatch = url.match(/[?&]vid=([^&]+)/);
      if (!vidMatch) {
        logger.warn('Failed to extract vid from Youku URL:', url);
        return url;
      }

      const vid = vidMatch[1];
      const convertedUrl = `https://v.youku.com/v_show/id_${vid}.html`;

      logger.info(`Converted Youku URL: ${url} -> ${convertedUrl}`);
      return convertedUrl;
    } catch (error) {
      logger.error('Error converting Youku URL:', error);
      return url;
    }
  }

  /**
   * 从 URL 中提取平台信息
   */
  static extractPlatform(url: string): string | null {
    const platformMap: Record<string, string> = {
      'bilibili.com': 'bilibili',
      'iqiyi.com': 'iqiyi',
      'qq.com': 'tencent',
      'mgtv.com': 'mango',
      'youku.com': 'youku'
    };

    for (const [domain, platform] of Object.entries(platformMap)) {
      if (url.includes(domain)) {
        return platform;
      }
    }

    // 检查是否为人人视频格式（不是标准URL格式）
    const urlPattern = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/.*)?$/i;
    if (!urlPattern.test(url)) {
      return 'renren';
    }

    return null;
  }

  /**
   * 验证 URL 格式
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 规范化 URL（去除多余参数，统一格式）
   */
  static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // 移除常见的跟踪参数
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'from', 'spm_id_from'];
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });

      return urlObj.toString();
    } catch {
      logger.warn('Failed to normalize URL:', url);
      return url;
    }
  }

  /**
   * 从URL中提取参数
   */
  static extractParams(url: string): Record<string, string> {
    try {
      const urlObj = new URL(url);
      const params: Record<string, string> = {};

      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      return params;
    } catch {
      logger.warn('Failed to extract params from URL:', url);
      return {};
    }
  }
}

/**
 * 时间处理工具 - 业务特定逻辑
 */
export class TimeUtils {
  /**
   * 时间字符串转换为秒数
   * 支持格式：HH:MM:SS, MM:SS, SS
   */
  static timeToSeconds(timeStr: string): number {
    try {
      const parts = timeStr.split(':').map(Number);
      let seconds = 0;

      if (parts.length === 3) {
        // HH:MM:SS
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        // MM:SS
        seconds = parts[0] * 60 + parts[1];
      } else if (parts.length === 1) {
        // SS
        seconds = parts[0] || 0;
      }

      return seconds;
    } catch {
      logger.warn('Failed to convert time to seconds:', timeStr);
      return 0;
    }
  }

  /**
   * 秒数转换为时间字符串
   */
  static secondsToTime(seconds: number): string {
    try {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else {
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
    } catch {
      logger.warn('Failed to convert seconds to time:', seconds);
      return '00:00';
    }
  }

  /**
   * 获取格式化的时间戳
   */
  static getFormattedTimestamp(date?: Date): string {
    const d = date || new Date();
    return d.toISOString().replace('T', ' ').substring(0, 19);
  }

  /**
   * 检查时间是否过期
   */
  static isExpired(timestamp: number, expirationHours: number = 2): boolean {
    const now = Date.now();
    const expirationTime = timestamp + (expirationHours * 60 * 60 * 1000);
    return now > expirationTime;
  }
}

/**
 * 字符串处理工具 - 业务特定逻辑
 */
export class StringUtils {
  /**
   * 安全的JSON解析
   */
  static safeJsonParse<T = any>(str: string, defaultValue: T | null = null): T | null {
    try {
      return JSON.parse(str);
    } catch {
      logger.warn('Failed to parse JSON:', str);
      return defaultValue;
    }
  }

  /**
   * 生成随机字符串
   */
  static generateRandomString(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 转义HTML特殊字符
   */
  static escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * 截断字符串并添加省略号
   */
  static truncate(str: string, maxLength: number = 100): string {
    if (str.length <= maxLength) {
      return str;
    }
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * 格式化日志消息
   */
  static formatLogMessage(message: any): string {
    if (typeof message === 'string') {
      return message;
    }
    if (typeof message === 'object') {
      try {
        return JSON.stringify(message, null, 2);
      } catch {
        return String(message);
      }
    }
    return String(message);
  }
}

/**
 * 数据验证工具 - 业务特定逻辑
 */
export class ValidationUtils {
  /**
   * 验证邮箱格式
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证字符串长度
   */
  static isValidLength(str: string, minLength: number = 0, maxLength: number = Infinity): boolean {
    return str.length >= minLength && str.length <= maxLength;
  }

  /**
   * 验证ID格式（数字或字符串）
   */
  static isValidId(id: any): boolean {
    if (typeof id === 'number') {
      return Number.isInteger(id) && id > 0;
    }
    if (typeof id === 'string') {
      return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0;
    }
    return false;
  }

  /**
   * 验证对象是否包含必需字段
   */
  static hasRequiredFields(obj: any, requiredFields: string[]): boolean {
    if (!obj || typeof obj !== 'object') {
      return false;
    }
    return requiredFields.every(field => field in obj && obj[field] !== undefined);
  }

  /**
   * 清理和验证用户输入
   */
  static sanitizeInput(input: string, maxLength: number = 1000): string {
    if (typeof input !== 'string') {
      return '';
    }
    return input.trim().replace(/\s+/g, ' ').replace(/[\r\n]+/g, ' ').substring(0, maxLength);
  }
}

/**
 * 性能监控工具
 */
export class PerformanceUtils {
  private static timers: Map<string, number> = new Map();

  /**
   * 开始计时
   */
  static startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * 结束计时并返回耗时
   */
  static endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      logger.warn(`Timer '${name}' not found`);
      return 0;
    }

    const elapsed = Date.now() - startTime;
    this.timers.delete(name);

    logger.info(`Timer '${name}': ${elapsed}ms`);
    return elapsed;
  }

  /**
   * 异步函数性能监控装饰器
   */
  static async measureAsync<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      throw error;
    }
  }
}

// 统一的工具类导出
export const utils = {
  url: UrlUtils,
  time: TimeUtils,
  string: StringUtils,
  validation: ValidationUtils,
  performance: PerformanceUtils
};

export default utils;