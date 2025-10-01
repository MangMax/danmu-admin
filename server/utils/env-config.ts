/**
 * 环境配置管理模块
 * 基于 Nuxt runtimeConfig 的配置管理
 */

import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

// 配置类型定义
export interface DanmuConfig {
  token: string;
  otherServer: string;
  vodServer: string;
  bilibiliCookie: string;
  youkuConcurrency: number;
  version: string;
  allowedPlatforms: readonly string[];
  requestTimeout: number;
  maxRetryCount: number;
  maxLogs: number;
  maxAnimes: number;
  // 认证配置
  authUsername: string;
  authPassword: string;
  // 运行时环境信息
  runtime: 'cloudflare' | 'vercel' | 'node' | 'nitro' | 'unknown';
  nodeEnv: 'development' | 'production' | 'test';
}

/**
 * 配置管理器 - 基于 Nuxt runtimeConfig
 */
class DanmuConfigManager {
  private config: DanmuConfig | null = null;
  private static instance: DanmuConfigManager;

  private constructor() {
    // 配置将在第一次使用时懒加载
  }

  public static getInstance(): DanmuConfigManager {
    if (!DanmuConfigManager.instance) {
      DanmuConfigManager.instance = new DanmuConfigManager();
    }
    return DanmuConfigManager.instance;
  }

  /**
   * 加载配置 - 使用 Nuxt runtimeConfig
   */
  private async loadConfig(): Promise<DanmuConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      // 获取 Nuxt runtime config
      const runtimeConfig = useRuntimeConfig();

      // 检测运行时环境
      const runtime = this.detectRuntime();
      const nodeEnv = this.getNodeEnv();

      this.config = {
        token: runtimeConfig.token?.toString() || "", // 空字符串表示不使用token认证
        otherServer: runtimeConfig.otherServer,
        vodServer: runtimeConfig.vodServer,
        bilibiliCookie: runtimeConfig.bilibiliCookie || "",
        youkuConcurrency: Math.min(runtimeConfig.youkuConcurrency || 8, 16),
        version: runtimeConfig.public.version,
        allowedPlatforms: runtimeConfig.public.allowedPlatforms,
        requestTimeout: runtimeConfig.requestTimeout,
        maxRetryCount: runtimeConfig.maxRetryCount,
        maxLogs: runtimeConfig.public.maxLogs,
        maxAnimes: runtimeConfig.public.maxAnimes,
        authUsername: runtimeConfig.authUsername || "",
        authPassword: runtimeConfig.authPassword || "",
        runtime,
        nodeEnv
      };

      this.validateConfig();

      logger.info('Configuration loaded:', {
        runtime: this.config.runtime,
        nodeEnv: this.config.nodeEnv,
        version: this.config.version
      });

      return this.config;
    } catch (error) {
      logger.error('Failed to load runtime config, using fallback:', error);
      return this.getFallbackConfig();
    }
  }

  /**
   * 获取备用配置（当 runtimeConfig 不可用时）
   */
  private getFallbackConfig(): DanmuConfig {
    return {
      token: "", // 默认不使用token认证
      otherServer: "https://api.danmu.icu",
      vodServer: "https://www.caiji.cyou",
      bilibiliCookie: "",
      youkuConcurrency: Math.min(8, 16),
      version: "1.2.0",
      allowedPlatforms: ["qiyi", "bilibili1", "imgo", "youku", "qq"],
      requestTimeout: 30000,
      maxRetryCount: 3,
      maxLogs: 500,
      maxAnimes: 100,
      authUsername: "",
      authPassword: "",
      runtime: this.detectRuntime(),
      nodeEnv: this.getNodeEnv()
    };
  }

  /**
   * 检测运行时环境
   */
  private detectRuntime(): DanmuConfig['runtime'] {
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

    // Nitro/Nuxt 环境检测
    if (typeof (globalThis as any).__nitro__ !== 'undefined' ||
      typeof (globalThis as any).$fetch !== 'undefined') {
      return 'nitro';
    }

    return 'unknown';
  }

  /**
   * 获取 NODE_ENV
   */
  private getNodeEnv(): DanmuConfig['nodeEnv'] {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
      const env = process.env.NODE_ENV;
      if (['development', 'production', 'test'].includes(env)) {
        return env as DanmuConfig['nodeEnv'];
      }
    }
    return 'development';
  }

  /**
   * 获取当前配置
   */
  public async getConfig(): Promise<DanmuConfig> {
    return await this.loadConfig();
  }

  /**
   * 获取同步配置（使用缓存的配置）
   */
  public getConfigSync(): DanmuConfig | null {
    return this.config;
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    if (!this.config) return;

    const errors: string[] = [];

    // Token 验证 - 空字符串表示不使用认证（允许）
    // 如果设置了token，则不能为纯空白字符
    if (this.config.token && this.config.token.toString().trim().length === 0) {
      errors.push('token cannot be whitespace only, use empty string to disable authentication');
    }

    // 验证服务器 URL
    if (!this.isValidUrl(this.config.otherServer)) {
      errors.push('otherServer must be a valid URL');
    }

    if (!this.isValidUrl(this.config.vodServer)) {
      errors.push('vodServer must be a valid URL');
    }

    // 验证数值配置
    if (this.config.requestTimeout <= 0) {
      errors.push('requestTimeout must be greater than 0');
    }

    if (this.config.maxRetryCount < 0) {
      errors.push('maxRetryCount must be non-negative');
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
   * 获取调试信息
   */
  public async getDebugInfo(): Promise<object> {
    const config = await this.getConfig();
    return {
      runtime: config.runtime,
      nodeEnv: config.nodeEnv,
      version: config.version,
      tokenAuth: config.token ? "enabled" : "disabled",
      hasToken: !!config.token,
      tokenLength: config.token?.length || 0,
      hasCustomOtherServer: config.otherServer !== "https://api.danmu.icu",
      hasCustomVodServer: config.vodServer !== "https://www.caiji.cyou",
      requestTimeout: config.requestTimeout,
      maxRetryCount: config.maxRetryCount,
      allowedPlatforms: config.allowedPlatforms,
      maxLogs: config.maxLogs,
      maxAnimes: config.maxAnimes
    };
  }

  /**
   * 检查平台是否被允许
   */
  public async isPlatformAllowed(platform: string): Promise<boolean> {
    const config = await this.getConfig();
    return config.allowedPlatforms.includes(platform);
  }

  /**
   * 检查是否启用了Token认证
   */
  public async isTokenAuthEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return !!config.token && config.token.toString().trim().length > 0;
  }

  /**
   * 检查是否启用了密码认证
   */
  public async isPasswordAuthEnabled(): Promise<boolean> {
    const config = await this.getConfig();

    return !!(config.authUsername && config.authPassword &&
      config.authUsername?.toString().trim().length > 0 &&
      config.authPassword?.toString().trim().length > 0);
  }

  /**
   * 获取生产环境优化配置
   */
  public async getProductionOptimizations(): Promise<object> {
    const config = await this.getConfig();
    const isProduction = config.nodeEnv === 'production';

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
export const danmuConfig = DanmuConfigManager.getInstance();

// 导出便捷方法
export const config = {
  get: () => danmuConfig.getConfig(),
  getDebugInfo: () => danmuConfig.getDebugInfo(),
  isPlatformAllowed: (platform: string) => danmuConfig.isPlatformAllowed(platform),
  getProductionOptimizations: () => danmuConfig.getProductionOptimizations(),
  isTokenAuthEnabled: () => danmuConfig.isTokenAuthEnabled(),
  isPasswordAuthEnabled: () => danmuConfig.isPasswordAuthEnabled(),

  // 常用配置的快捷访问器
  getToken: async () => (await danmuConfig.getConfig()).token,
  getAuthUsername: async () => (await danmuConfig.getConfig()).authUsername,
  getAuthPassword: async () => (await danmuConfig.getConfig()).authPassword,
  getOtherServer: async () => (await danmuConfig.getConfig()).otherServer,
  getVodServer: async () => (await danmuConfig.getConfig()).vodServer,
  getBilibiliCookie: async () => (await danmuConfig.getConfig()).bilibiliCookie,
  getYoukuConcurrency: async () => (await danmuConfig.getConfig()).youkuConcurrency,
  getVersion: async () => (await danmuConfig.getConfig()).version,
  getRuntime: async () => (await danmuConfig.getConfig()).runtime,
  isProduction: async () => (await danmuConfig.getConfig()).nodeEnv === 'production',
  getAllowedPlatforms: async () => (await danmuConfig.getConfig()).allowedPlatforms,
  getMaxLogs: async () => (await danmuConfig.getConfig()).maxLogs,
  getMaxAnimes: async () => (await danmuConfig.getConfig()).maxAnimes,
  getRequestTimeout: async () => (await danmuConfig.getConfig()).requestTimeout,
  getMaxRetryCount: async () => (await danmuConfig.getConfig()).maxRetryCount
};

// 同步版本的便捷方法（使用缓存的配置）
export const configSync = {
  get: () => danmuConfig.getConfigSync(),
  getToken: () => danmuConfig.getConfigSync()?.token,
  getOtherServer: () => danmuConfig.getConfigSync()?.otherServer,
  getVodServer: () => danmuConfig.getConfigSync()?.vodServer,
  getBilibiliCookie: () => danmuConfig.getConfigSync()?.bilibiliCookie,
  getYoukuConcurrency: () => danmuConfig.getConfigSync()?.youkuConcurrency,
  getVersion: () => danmuConfig.getConfigSync()?.version,
  getRuntime: () => danmuConfig.getConfigSync()?.runtime,
  isProduction: () => danmuConfig.getConfigSync()?.nodeEnv === 'production',
  getAllowedPlatforms: () => danmuConfig.getConfigSync()?.allowedPlatforms,
  getMaxLogs: () => danmuConfig.getConfigSync()?.maxLogs,
  getMaxAnimes: () => danmuConfig.getConfigSync()?.maxAnimes
};

export default config;
