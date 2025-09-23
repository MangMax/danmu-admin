# 弹幕API管理后台

基于 Nuxt 3 构建的现代化弹幕API管理系统，支持多平台弹幕获取和管理。

> **⚠️ 重要说明**: 本项目所有核心代码均来自 [danmu_api](https://github.com/your-repo/danmu_api)，仅用于练习 Nuxt 相关技术栈。不建议用于生产环境部署。

## 🚨 部署前必读

如果您仍要部署此项目，请注意以下几点：

1. **构建时间长** - 由于需要完整的 Nuxt 3 打包构建过程，部署时间会比原项目更长
2. **性能差异** - 性能不会比原项目更好，仅针对 Nuxt 框架做了特殊适配
3. **维护限制** - 所有核心特性均来自 danmu_api，不保证长期维护和更新
4. **学习目的** - 本项目主要用于学习 Nuxt 3、TypeScript 等现代前端技术栈

**建议**: 如需稳定的生产环境，请直接使用原版 [danmu_api](https://github.com/your-repo/danmu_api)。

## ✨ 特性

- 🚀 **开箱即用** - 无需复杂配置，下载即可运行
- 🔧 **灵活配置** - 支持环境变量和可视化配置
- 🌐 **多平台支持** - 爱奇艺、腾讯、优酷、芒果TV、B站、人人视频
- 📊 **实时监控** - 配置状态和日志可视化
- 🔒 **类型安全** - 完整的 TypeScript 支持
- 🔄 **完全兼容** - 与原有弹幕API系统100%兼容

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/your-repo/danmu-admin.git
cd danmu-admin
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 启动开发服务器
```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用！

## 📖 详细文档

- [兼容性说明](./DANMU_COMPATIBILITY.md) - 与原系统的兼容性保证
- [配置迁移指南](./CONFIG_MIGRATION.md) - 详细的配置系统说明

## ⚙️ 配置说明

### 环境变量配置（可选）

如需自定义配置，复制环境变量示例文件：

```bash
cp .env.example .env
```

### 配置验证

访问 `/api/config` 查看当前配置状态。

## 🌐 API 端点

### 核心API（与原系统兼容）

```
GET  /api/v2/search/anime          # 搜索动漫
GET  /api/v2/search/episodes       # 搜索集数  
POST /api/v2/match                 # 匹配动漫
GET  /api/v2/bangumi/:animeId      # 获取番剧详情
GET  /api/v2/comment/:commentId    # 获取弹幕
GET  /api/logs                     # 获取日志
```

### 新增API

```
GET  /api/config                   # 配置信息
GET  /api/cache/stats              # 缓存统计
GET  /api/cache/details            # 缓存数据详情
POST /api/cache/clear              # 清空缓存
GET  /api/test/config-validation   # 配置验证测试
POST /api/test/add-sample-data     # 添加测试数据
```

## 📦 部署方式

### 1. Docker 部署

#### 构建镜像
```bash
# 构建 Docker 镜像
docker build -t danmu-admin .

# 运行容器
docker run -d \
  --name danmu-admin \
  -p 3000:3000 \
  -e NUXT_OTHER_SERVER=https://api.danmu.icu \
  -e NUXT_VOD_SERVER=https://www.caiji.cyou \
  danmu-admin
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  danmu-admin:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NUXT_OTHER_SERVER=https://api.danmu.icu
      - NUXT_VOD_SERVER=https://www.caiji.cyou
      - NUXT_BILIBILI_COOKIE=""
      - NUXT_YOUKU_CONCURRENCY=8
    restart: unless-stopped
```

```bash
# 启动服务
docker-compose up -d
```

### 2. Vercel 部署

#### 一键部署
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/danmu-admin)

#### 手动部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel --prod

# 设置环境变量
vercel env add NUXT_OTHER_SERVER
vercel env add NUXT_VOD_SERVER
vercel env add NUXT_BILIBILI_COOKIE
vercel env add NUXT_YOUKU_CONCURRENCY
```

### 3. Netlify 部署

#### 一键部署
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/your-repo/danmu-admin)

#### 手动部署
```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 构建项目
pnpm build

# 部署
netlify deploy --prod --dir=.output/public

# 设置环境变量（在 Netlify 控制台）
# Site settings > Environment variables
```

#### netlify.toml 配置
```toml
[build]
  command = "pnpm build"
  publish = ".output/public"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4. Cloudflare Pages 部署

#### 一键部署
[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-repo/danmu-admin)

#### 手动部署
```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 构建项目
pnpm build

# 部署到 Cloudflare Pages
wrangler pages deploy .output/public --project-name=danmu-admin
```

#### wrangler.toml 配置
```toml
name = "danmu-admin"
compatibility_date = "2024-01-01"

[env.production]
vars = { NUXT_OTHER_SERVER = "https://api.danmu.icu" }
```

### 环境变量配置

所有部署方式都需要配置以下环境变量：

#### 核心服务配置
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NUXT_OTHER_SERVER` | `https://api.danmu.icu` | 第三方弹幕服务器 |
| `NUXT_VOD_SERVER` | `https://www.caiji.cyou` | VOD视频资源服务器 |
| `NUXT_BILIBILI_COOKIE` | `""` | B站Cookie配置 |
| `NUXT_YOUKU_CONCURRENCY` | `8` | 优酷并发数配置 (最大16) |

#### 性能与重试配置
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NUXT_REQUEST_TIMEOUT` | `30000` | 请求超时时间 (毫秒) |
| `NUXT_MAX_RETRY_COUNT` | `3` | 最大重试次数 |

#### 认证配置 (可选)
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NUXT_AUTH_USERNAME` | `""` | 基础认证用户名 (空字符串表示不启用) |
| `NUXT_AUTH_PASSWORD` | `""` | 基础认证密码 |
| `NUXT_TOKEN` | `""` | API访问令牌 (空字符串表示不启用认证) |

#### 客户端配置
| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NUXT_PUBLIC_MAX_LOGS` | `500` | 最大日志条数 |
| `NUXT_PUBLIC_MAX_ANIMES` | `100` | 最大动漫缓存数 |

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建应用
pnpm build

# 预览构建结果
pnpm preview
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
