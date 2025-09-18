/**
 * 环境配置管理模块
 * 跨平台环境适配 (Cloudflare/Vercel/Node)
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

// 默认配置常量
export const DEFAULT_CONFIG = {
  TOKEN: "87654321",
  OTHER_SERVER: "https://api.danmu.icu",
  VOD_SERVER: "https://www.caiji.cyou",
  VERSION: "1.0.2",
  ALLOWED_PLATFORMS: ["qiyi", "bilibili1", "imgo", "youku", "qq"],
  REQUEST_TIMEOUT: 30000,
  MAX_RETRY_COUNT: 3
} as const;

// 配置类型定义
export interface EnvironmentConfig {
  TOKEN: string;
  OTHER_SERVER: string;
  VOD_SERVER: string;
  VERSION: string;
  ALLOWED_PLATFORMS: readonly string[];
  REQUEST_TIMEOUT: number;
  MAX_RETRY_COUNT: number;
  // 运行时环境信息
  RUNTIME: 'cloudflare' | 'vercel' | 'node' | 'unknown';
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * 环境配置管理器
 */
class EnvironmentConfigManager {
  private config: EnvironmentConfig;
  private static instance: EnvironmentConfigManager;

  private constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
    logger.info('Environment configuration loaded:', {
      runtime: this.config.RUNTIME,
      nodeEnv: this.config.NODE_ENV,
      hasCustomToken: this.config.TOKEN !== DEFAULT_CONFIG.TOKEN
    });
  }

  public static getInstance(): EnvironmentConfigManager {
    if (!EnvironmentConfigManager.instance) {
      EnvironmentConfigManager.instance = new EnvironmentConfigManager();
    }
    return EnvironmentConfigManager.instance;
  }

  /**
   * 加载配置
   * 支持多种环境下的配置获取
   */
  private loadConfig(): EnvironmentConfig {
    // 检测运行时环境
    const runtime = this.detectRuntime();
    const nodeEnv = this.getNodeEnv();

    return {
      TOKEN: this.resolveToken(),
      OTHER_SERVER: this.resolveOtherServer(),
      VOD_SERVER: this.resolveVodServer(),
      VERSION: DEFAULT_CONFIG.VERSION,
      ALLOWED_PLATFORMS: DEFAULT_CONFIG.ALLOWED_PLATFORMS,
      REQUEST_TIMEOUT: this.resolveTimeout(),
      MAX_RETRY_COUNT: this.resolveRetryCount(),
      RUNTIME: runtime,
      NODE_ENV: nodeEnv
    };
  }

  /**
   * 检测运行时环境
   */
  private detectRuntime(): EnvironmentConfig['RUNTIME'] {
    // Cloudflare Workers 环境检测
    if (typeof globalThis.caches !== 'undefined' &&
      typeof globalThis.Request !== 'undefined' &&
      typeof globalThis.Response !== 'undefined') {
      return 'cloudflare';
    }

    // Vercel 环境检测
    if (typeof process !== 'undefined' &&
      process.env?.VERCEL === '1') {
      return 'vercel';
    }

    // Node.js 环境检测
    if (typeof process !== 'undefined' &&
      process.versions?.node) {
      return 'node';
    }

    return 'unknown';
  }

  /**
   * 获取 NODE_ENV
   */
  private getNodeEnv(): EnvironmentConfig['NODE_ENV'] {
    const env = this.getEnvVar('NODE_ENV') || 'development';
    if (['development', 'production', 'test'].includes(env)) {
      return env as EnvironmentConfig['NODE_ENV'];
    }
    return 'development';
  }

  /**
   * 通用环境变量获取器
   * 支持 Cloudflare Workers 和 Node.js 环境
   */
  private getEnvVar(key: string, env?: any): string | undefined {
    // 优先使用传入的 env 对象 (适用于 Cloudflare Workers)
    if (env && env[key]) {
      return env[key];
    }

    // 其次使用 process.env (适用于 Vercel/Node.js)
    if (typeof process !== 'undefined' && process.env?.[key]) {
      return process.env[key];
    }

    return undefined;
  }

  /**
   * 解析 TOKEN 配置
   */
  private resolveToken(env?: any): string {
    return this.getEnvVar('TOKEN', env) || DEFAULT_CONFIG.TOKEN;
  }

  /**
   * 解析 OTHER_SERVER 配置
   */
  private resolveOtherServer(env?: any): string {
    return this.getEnvVar('OTHER_SERVER', env) || DEFAULT_CONFIG.OTHER_SERVER;
  }

  /**
   * 解析 VOD_SERVER 配置
   */
  private resolveVodServer(env?: any): string {
    return this.getEnvVar('VOD_SERVER', env) || DEFAULT_CONFIG.VOD_SERVER;
  }

  /**
   * 解析请求超时配置
   */
  private resolveTimeout(env?: any): number {
    const timeout = this.getEnvVar('REQUEST_TIMEOUT', env);
    if (timeout) {
      const parsed = parseInt(timeout, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return DEFAULT_CONFIG.REQUEST_TIMEOUT;
  }

  /**
   * 解析重试次数配置
   */
  private resolveRetryCount(env?: any): number {
    const retryCount = this.getEnvVar('MAX_RETRY_COUNT', env);
    if (retryCount) {
      const parsed = parseInt(retryCount, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return DEFAULT_CONFIG.MAX_RETRY_COUNT;
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    const errors: string[] = [];

    // 验证 TOKEN
    if (!this.config.TOKEN || this.config.TOKEN.length < 4) {
      errors.push('TOKEN must be at least 4 characters long');
    }

    // 验证服务器 URL
    if (!this.isValidUrl(this.config.OTHER_SERVER)) {
      errors.push('OTHER_SERVER must be a valid URL');
    }

    if (!this.isValidUrl(this.config.VOD_SERVER)) {
      errors.push('VOD_SERVER must be a valid URL');
    }

    // 验证数值配置
    if (this.config.REQUEST_TIMEOUT <= 0) {
      errors.push('REQUEST_TIMEOUT must be greater than 0');
    }

    if (this.config.MAX_RETRY_COUNT < 0) {
      errors.push('MAX_RETRY_COUNT must be non-negative');
    }

    if (errors.length > 0) {
      logger.error('Configuration validation failed:', errors);
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }

    logger.info('Configuration validation passed');
  }

  /**
   * 验证 URL 格式
   */
  private isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): Readonly<EnvironmentConfig> {
    return { ...this.config };
  }

  /**
   * 动态更新配置 (用于运行时从请求中获取环境变量)
   * 主要用于 Cloudflare Workers
   */
  public updateFromEnv(env: any): EnvironmentConfig {
    const updatedConfig: EnvironmentConfig = {
      ...this.config,
      TOKEN: this.resolveToken(env),
      OTHER_SERVER: this.resolveOtherServer(env),
      VOD_SERVER: this.resolveVodServer(env),
      REQUEST_TIMEOUT: this.resolveTimeout(env),
      MAX_RETRY_COUNT: this.resolveRetryCount(env)
    };

    // 临时验证更新后的配置
    const tempConfig = this.config;
    this.config = updatedConfig;
    try {
      this.validateConfig();
      logger.info('Configuration updated from environment');
    } catch (error) {
      // 如果验证失败，恢复原配置
      this.config = tempConfig;
      logger.error('Failed to update configuration from environment:', error);
      throw error;
    }

    return { ...this.config };
  }

  /**
   * 获取调试信息
   */
  public getDebugInfo(): object {
    return {
      runtime: this.config.RUNTIME,
      nodeEnv: this.config.NODE_ENV,
      version: this.config.VERSION,
      hasCustomToken: this.config.TOKEN !== DEFAULT_CONFIG.TOKEN,
      hasCustomOtherServer: this.config.OTHER_SERVER !== DEFAULT_CONFIG.OTHER_SERVER,
      hasCustomVodServer: this.config.VOD_SERVER !== DEFAULT_CONFIG.VOD_SERVER,
      requestTimeout: this.config.REQUEST_TIMEOUT,
      maxRetryCount: this.config.MAX_RETRY_COUNT,
      allowedPlatforms: this.config.ALLOWED_PLATFORMS
    };
  }

  /**
   * 检查平台是否被允许
   */
  public isPlatformAllowed(platform: string): boolean {
    return this.config.ALLOWED_PLATFORMS.includes(platform);
  }

  /**
   * 获取生产环境优化配置
   */
  public getProductionOptimizations(): object {
    const isProduction = this.config.NODE_ENV === 'production';

    return {
      enableDebugLogs: !isProduction,
      enableDetailedErrors: !isProduction,
      enableCaching: true,
      cacheMaxAge: isProduction ? 3600 : 300, // 1小时 vs 5分钟
      enableCompression: isProduction,
      enableSecurityHeaders: isProduction
    };
  }
}

// 导出单例实例
export const envConfig = EnvironmentConfigManager.getInstance();

// 导出便捷方法
export const config = {
  get: () => envConfig.getConfig(),
  updateFromEnv: (env: any) => envConfig.updateFromEnv(env),
  getDebugInfo: () => envConfig.getDebugInfo(),
  isPlatformAllowed: (platform: string) => envConfig.isPlatformAllowed(platform),
  getProductionOptimizations: () => envConfig.getProductionOptimizations(),

  // 常用配置的快捷访问器
  getToken: (env?: any) => envConfig.updateFromEnv(env || {}).TOKEN,
  getOtherServer: (env?: any) => envConfig.updateFromEnv(env || {}).OTHER_SERVER,
  getVodServer: (env?: any) => envConfig.updateFromEnv(env || {}).VOD_SERVER,
  getVersion: () => envConfig.getConfig().VERSION,
  getRuntime: () => envConfig.getConfig().RUNTIME,
  isProduction: () => envConfig.getConfig().NODE_ENV === 'production'
};

// 导出默认配置
export { DEFAULT_CONFIG };

export default config;
