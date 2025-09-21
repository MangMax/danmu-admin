# 配置系统迁移指南

本文档说明了从 `danmu.js` 的硬编码配置迁移到基于 Nuxt `runtimeConfig` 的配置系统。

## 🔓 重要更新: Token 认证已禁用

**新版本已移除 Token 认证机制，系统现在开箱即用！**

## 🚀 新配置系统优势

1. **环境变量支持**: 使用标准的 `.env` 文件和环境变量
2. **类型安全**: 完整的 TypeScript 类型支持
3. **热重载**: 开发环境下配置变更自动生效
4. **多环境支持**: 开发、生产、测试环境独立配置
5. **安全性**: 敏感配置不会暴露到客户端

## 📁 文件结构

```
├── nuxt.config.ts                 # Nuxt 配置，定义 runtimeConfig
├── .env.example                   # 环境变量示例文件
├── server/
│   ├── utils/
│   │   ├── env-config.ts         # 配置管理器（重构）
│   │   └── danmu-config.ts       # 弹幕服务配置（新增）
│   └── api/
│       └── config.get.ts         # 配置信息 API
└── danmu.js                      # 原有文件（保留兼容性）
```

## ⚙️ 配置方式

### 1. 环境变量配置

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 2. 主要配置项

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `NUXT_TOKEN` | `87654321` | API 访问令牌 |
| `NUXT_OTHER_SERVER` | `https://api.danmu.icu` | 第三方弹幕服务器 |
| `NUXT_VOD_SERVER` | `https://www.caiji.cyou` | VOD 视频资源服务器 |
| `NUXT_BILIBILI_COOKIE` | `""` | B站Cookie配置 🆕 |
| `NUXT_YOUKU_CONCURRENCY` | `8` | 优酷并发数配置 (最大16) 🆕 |
| `NUXT_REQUEST_TIMEOUT` | `30000` | 请求超时时间（毫秒） |
| `NUXT_MAX_RETRY_COUNT` | `3` | 最大重试次数 |
| `NUXT_PUBLIC_MAX_LOGS` | `500` | 最大日志条数 |
| `NUXT_PUBLIC_MAX_ANIMES` | `100` | 最大动画缓存数量 |

### 3. 运行时配置

在 `nuxt.config.ts` 中定义：

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    // 私有配置（仅服务端可用）
    token: process.env.NUXT_TOKEN || "87654321",
    otherServer: process.env.NUXT_OTHER_SERVER || "https://api.danmu.icu",
    vodServer: process.env.NUXT_VOD_SERVER || "https://www.caiji.cyou",
    
    // 公共配置（客户端可用）
    public: {
      version: "1.0.3",
      allowedPlatforms: ["qiyi", "bilibili1", "imgo", "youku", "qq"]
    }
  },
  
  nitro: {
    storage: {
      // 统一使用内存存储，开箱即用
      default: { driver: 'memory' },
      logs: { driver: 'fs', base: './logs' }
    }
  }
})
```

## 🔧 使用方法

### 1. 在服务器端使用

```typescript
import { config } from '~/server/utils/env-config';

// 异步获取配置
const token = await config.getToken();
const allowedPlatforms = await config.getAllowedPlatforms();

// 检查平台是否允许
const isAllowed = await config.isPlatformAllowed('bilibili1');
```

### 2. 使用弹幕配置工具

```typescript
import { 
  getToken, 
  getAllowedPlatforms, 
  log,
  addAnime 
} from '~/server/utils/danmu-config';

// 获取配置
const token = await getToken();
const platforms = await getAllowedPlatforms();

// 使用日志
log('info', 'Search started', { keyword: 'anime' });

// 管理动画缓存
await addAnime(animeData);
```

### 3. 在 API 路由中使用

```typescript
export default defineEventHandler(async (event) => {
  const config = await getDanmuConfig();
  
  return {
    version: config.version,
    allowedPlatforms: config.allowedPlatforms
  };
});
```

## 🔄 迁移步骤

### 1. 从 danmu.js 迁移

原有的 `danmu.js` 代码：
```javascript
const DEFAULT_TOKEN = "87654321";
let token = DEFAULT_TOKEN;

function resolveToken(env) {
  if (env && env.TOKEN) return env.TOKEN;
  if (typeof process !== "undefined" && process.env?.TOKEN) return process.env.TOKEN;
  return DEFAULT_TOKEN;
}
```

新的配置方式：
```typescript
import { getToken } from '~/server/utils/danmu-config';

const token = await getToken(); // 自动处理环境变量
```

### 2. 更新 API 路由

将现有的 API 路由从直接使用 `danmu.js` 中的变量改为使用配置工具：

```typescript
// 旧方式
// 直接使用 danmu.js 中的全局变量

// 新方式
import { getToken, log } from '~/server/utils/danmu-config';

export default defineEventHandler(async (event) => {
  const token = await getToken();
  log('info', 'API called');
  // ...
});
```

## 🌍 部署环境

### 1. Vercel 部署

在 Vercel 控制台设置环境变量：
```
NUXT_TOKEN=your_token_here
NUXT_OTHER_SERVER=https://your-server.com
NUXT_VOD_SERVER=https://your-vod-server.com
```

### 2. Cloudflare Workers 部署

在 `wrangler.toml` 中配置：
```toml
[env.production.vars]
NUXT_TOKEN = "your_token_here"
NUXT_OTHER_SERVER = "https://your-server.com"
NUXT_VOD_SERVER = "https://your-vod-server.com"
```

### 3. Docker 部署

在 `docker-compose.yml` 中：
```yaml
environment:
  - NUXT_TOKEN=your_token_here
  - NUXT_OTHER_SERVER=https://your-server.com
  - NUXT_VOD_SERVER=https://your-vod-server.com
```

## 🔍 调试和监控

### 1. 配置信息 API

访问 `/api/config` 查看当前配置状态：

```json
{
  "version": "1.0.3",
  "allowedPlatforms": ["qiyi", "bilibili1", "imgo", "youku", "qq"],
  "runtime": "nitro",
  "nodeEnv": "development",
  "hasCustomToken": false,
  "hasCustomOtherServer": false
}
```

### 2. 日志记录

新的日志系统支持结构化日志：

```typescript
import { log } from '~/server/utils/danmu-config';

log('info', 'User search', { keyword: 'anime', userId: 123 });
log('error', 'API failed', { error: error.message, endpoint: '/api/search' });
```

## 🛠️ 故障排除

### 1. 配置未生效

- 检查环境变量名称是否正确（必须以 `NUXT_` 开头）
- 重启开发服务器
- 检查 `.env` 文件是否在项目根目录

### 2. TypeScript 错误

- 运行 `npm run postinstall` 重新生成类型
- 检查 `nuxt.config.ts` 中的配置类型

### 3. 运行时错误

- 检查 `/api/config` 端点是否返回正确信息
- 查看服务器日志了解详细错误信息

## 📚 相关文档

- [Nuxt Runtime Config](https://nuxt.com/docs/guide/going-further/runtime-config)
- [Environment Variables](https://nuxt.com/docs/guide/going-further/runtime-config#environment-variables)
- [Server API](https://nuxt.com/docs/guide/directory-structure/server)

## 🤝 向后兼容性

原有的 `danmu.js` 文件仍然保留，以确保现有功能正常运行。建议逐步迁移到新的配置系统。
