# 弹幕API管理后台

基于 Nuxt 3 构建的现代化弹幕API管理系统，支持多平台弹幕获取和管理。

> **⚠️ 重要说明**: 本项目所有核心代码均来自 [danmu_api](https://github.com/huangxd-/danmu_api)，仅用于练习 Nuxt 相关技术栈。不建议用于生产环境部署。
如有任何侵权行为，请联系本人删除。

## 🚨 部署前必读

如果您仍要部署此项目，请注意以下几点：

1. **构建时间长** - 由于需要完整的 Nuxt 3 打包构建过程，部署时间会比原项目更长
2. **性能差异** - 性能不会比原项目更好，仅针对 Nuxt 框架做了特殊适配
3. **维护限制** - 所有核心特性均来自 danmu_api，不保证长期维护和更新
4. **学习目的** - 本项目主要用于学习 Nuxt 3、TypeScript 等现代前端技术栈
5. **项目性质** - 由于原项目本质是以即时获取弹幕为主，所以本项目也不会增加持久化相关的任何功能，你只会收获一个用处不大的看板界面。

**建议**: 如需稳定的生产环境，请直接使用原版 [danmu_api](https://github.com/huangxd-/danmu_api)。

## ✨ 特性

- 🚀 **开箱即用** - 无需复杂配置，下载即可运行
- 🔧 **灵活配置** - 支持环境变量和可视化配置
- 🌐 **多平台支持** - 爱奇艺、腾讯、优酷、芒果TV、B站、人人视频、韩小圈
- 📊 **实时监控** - 配置状态和日志可视化
- 🔒 **类型安全** - 完整的 TypeScript 支持
- 🔄 **完全兼容** - 与原有弹幕API系统100%兼容

[deploy-on-vercel-button-image]: https://vercel.com/button
[deploy-on-vercel-link]: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FMangMax%2Fdanmu-admin&env=NUXT_TOKEN&envDescription=For%20safety,%20please%20set%20up%20a%20token&project-name=danmu-admin&repository-name=danmu-admin
[deploy-on-netlify-button-image]: https://www.netlify.com/img/deploy/button.svg
[deploy-on-netlify-link]: https://app.netlify.com/start/deploy?repository=https://github.com/MangMax/danmu-admin
[deploy-on-cloudflare-pages-button-image]: https://deploy.workers.cloudflare.com/button
[deploy-on-cloudflare-pages-link]: https://deploy.workers.cloudflare.com/?url=https://github.com/MangMax/danmu-admin

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/MangMax/danmu-admin.git
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

## 🌏 自托管

本项目提供了 Vercel、Netlify、Cloudflare Pages、Docker 镜像等多种部署方式，可以让你在几分钟内部署自己的弹幕API管理系统。

### `A` 使用 Vercel, Netlify, Cloudflare Pages 等Serverless平台部署

#### 使用 Vercel, Netlify, Cloudflare Pages 等Serverless平台部署，你可以自行部署到其他平台，目前主流平台都已支持Nuxt一键部署，注意Edgeone还不支持全栈Nuxt。

如果你想要在 Vercel, Netlify, Cloudflare Pages 等Serverless平台部署这个服务，你可以按照以下步骤：

- Fork 这个项目，我强烈建议你先fork这个项目，在你fork之后，只保留上游同步动作，并禁用其他动作在你的 GitHub 仓库上。
- 点击下面的按钮开始部署: 直接使用你的 GitHub 账号登录，并在环境变量中填写 `NUXT_TOKEN` (推荐)。
- 部署完成后，你可以开始使用它。
- 绑定一个自定义域名 (可选): Vercel 分配的域名的 DNS 在一些地区会被污染; 绑定一个自定义域名可以直连(推荐)。

<div align="center">

|           在Vercel部署            |                    在Netlify部署                      |                    在Cloudflare Pages部署                      |
| :-------------------------------------: | :---------------------------------------------------------: | :---------------------------------------------------------: |
| [![][deploy-on-vercel-button-image]][deploy-on-vercel-link] | [![][deploy-on-netlify-button-image]][deploy-on-netlify-link] | [![][deploy-on-cloudflare-pages-button-image]][deploy-on-cloudflare-pages-link] |
</div>

### `B` 使用 Docker 部署

#### 使用 Docker 部署

如果你想要使用 Docker 部署这个服务，你可以按照以下步骤：

1. 拉取 Docker 镜像
```bash
docker pull mangmax/danmu-admin:latest
```
2. 运行 Docker 容器
```bash
docker run -d --name danmu-admin -p 3000:3000 mangmax/danmu-admin:latest
```

如果需要设置令牌，可以在运行容器时设置 `NUXT_TOKEN` 环境变量。
```bash
docker run -d --name danmu-admin -p 3000:3000 -e NUXT_TOKEN=your_token_here mangmax/danmu-admin:latest
```

3. 访问 [http://localhost:3000](http://localhost:3000) 即可使用！

<br/>

## 🔧 环境变量配置

所有环境变量如下，都是可选的：

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

## 🤝 感谢

感谢 [danmu_api](https://github.com/huangxd-/danmu_api) 开源！

## 技术栈

如果你对本项目感兴趣，可以查看以下技术栈：
- Nuxt 3
- TypeScript
- Vite
- Vue
- Unocss
- Shadcn Nuxt
- VueUse
- ES Toolkit
- Crypto JS
- Crypto TS
- Iconv Lite
- nuxt-auth-utils

## 📄 许可证

MIT License
