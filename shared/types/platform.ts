/**
 * 平台相关的类型定义
 */

/**
 * 支持的弹幕平台
 */
export type DanmakuPlatform =
  | 'bilibili'
  | 'iqiyi'
  | 'tencent'
  | 'mango'
  | 'youku'
  | 'renren'
  | 'hanjutv';

/**
 * 平台配置
 */
export interface PlatformConfig {
  name: DanmakuPlatform;
  enabled: boolean;
  timeout: number;
  priority: number;
  rateLimit?: {
    requests: number;
    window: number; // 时间窗口（毫秒）
  };
  headers?: Record<string, string>;
  userAgent?: string;
}

/**
 * 平台识别结果
 */
export interface PlatformMatch {
  platform: DanmakuPlatform;
  confidence: number;
  patterns: string[];
  url: string;
}

/**
 * 平台状态
 */
export interface PlatformStatus {
  platform: DanmakuPlatform;
  status: 'online' | 'offline' | 'degraded';
  lastCheck: number;
  responseTime?: number;
  errorRate?: number;
  lastError?: string;
}

/**
 * 平台能力
 */
export interface PlatformCapabilities {
  platform: DanmakuPlatform;
  supports: {
    search: boolean;
    danmaku: boolean;
    episodes: boolean;
    seasons: boolean;
    realTime: boolean;
  };
  limits: {
    maxSearchResults: number;
    maxDanmakuPerRequest: number;
    rateLimitPerMinute: number;
  };
  features: {
    encryption: boolean;
    compression: boolean;
    caching: boolean;
    streaming: boolean;
  };
}
