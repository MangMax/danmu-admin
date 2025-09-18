// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  nitro: {
    storage: {
      // 开发环境使用内存存储
      dev: {
        driver: 'memory'
      },

      // 生产环境配置
      production: {
        driver: 'redis', // 生产环境推荐使用 Redis
        // 如果没有 Redis，回退到文件系统
        fallback: {
          driver: 'fs',
          base: './storage'
        }
      },

      // 搜索结果缓存
      search: {
        driver: 'memory', // 或者 'redis' 用于生产环境
        ttl: 30 * 60 // 30分钟
      },

      // 动画详情缓存
      anime: {
        driver: 'memory',
        ttl: 2 * 60 * 60 // 2小时
      },

      // 日志存储
      logs: {
        driver: 'fs',
        base: './logs',
        ttl: 24 * 60 * 60 // 24小时
      }
    }
  }
})
