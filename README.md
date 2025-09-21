# 弹幕API管理后台

基于 Nuxt 3 构建的现代化弹幕API管理系统，支持多平台弹幕获取和管理。

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

主要配置项：

| 环境变量 | 默认值 | 说明 |
|---------|--------|------|
| `NUXT_OTHER_SERVER` | `https://api.danmu.icu` | 第三方弹幕服务器 |
| `NUXT_VOD_SERVER` | `https://www.caiji.cyou` | VOD视频资源服务器 |
| `NUXT_BILIBILI_COOKIE` | `""` | B站Cookie配置 🆕 |
| `NUXT_YOUKU_CONCURRENCY` | `8` | 优酷并发数配置 (最大16) 🆕 |

> **注意**: Token 认证已禁用，系统开箱即用，无需配置访问令牌。

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

## 📦 生产部署

### 构建应用

```bash
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

### 部署到 Vercel

```bash
# 设置环境变量后一键部署
vercel --prod
```

### 部署到 Cloudflare Workers

```bash
# 配置 wrangler.toml 后部署
wrangler publish
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
