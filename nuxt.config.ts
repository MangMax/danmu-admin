// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  typescript: {
    tsConfig: {
      compilerOptions: {
        target: 'ES2023',
        lib: ["ES2023",
          "DOM",
          "DOM.Iterable",
          "ESNext",
          "dom",
          "dom.iterable",
          "webworker"
        ],
        module: 'ESNext',
        moduleResolution: 'bundler',
      }
    }
  },
  modules: [
    '@unocss/nuxt',
    'shadcn-nuxt',
  ],
  shadcn: {
    componentDir: './app/components/ui'
  },
  // Runtime 配置 - 支持环境变量
  runtimeConfig: {
    // Private keys (only available on server-side)
    token: process.env.NUXT_TOKEN || "", // API访问令牌，空字符串表示不启用认证
    otherServer: process.env.NUXT_OTHER_SERVER || "https://api.danmu.icu",
    vodServer: process.env.NUXT_VOD_SERVER || "https://www.caiji.cyou",
    bilibiliCookie: process.env.NUXT_BILIBILI_COOKIE || "",
    youkuConcurrency: Math.min(parseInt(process.env.NUXT_YOUKU_CONCURRENCY || "8"), 16),
    requestTimeout: parseInt(process.env.NUXT_REQUEST_TIMEOUT || "30000"),
    maxRetryCount: parseInt(process.env.NUXT_MAX_RETRY_COUNT || "3"),

    // Public keys (exposed to client-side)
    public: {
      version: "1.1.0",
      allowedPlatforms: ["qiyi", "bilibili1", "imgo", "youku", "qq"],
      maxLogs: parseInt(process.env.NUXT_PUBLIC_MAX_LOGS || "500"),
      maxAnimes: parseInt(process.env.NUXT_PUBLIC_MAX_ANIMES || "100"),
    }
  },

  nitro: {
    storage: {
      // 统一使用内存存储，开箱即用
      default: {
        driver: 'memory'
      },

      // 日志存储使用文件系统
      logs: {
        driver: 'fs',
        base: './logs'
      }
    }
  }
})
