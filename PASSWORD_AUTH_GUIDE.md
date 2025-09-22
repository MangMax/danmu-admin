# 密码认证功能使用指南

## 功能概述

本项目已集成基于密码的登录认证功能，使用 `nuxt-auth-utils` 模块实现。用户可以通过设置环境变量来配置用户名和密码。

## 环境变量配置

在项目根目录创建 `.env` 文件，添加以下配置：

```env
# 认证配置
NUXT_AUTH_USERNAME=admin
NUXT_AUTH_PASSWORD=your_secure_password_here
```

## 功能特性

### 1. 认证状态管理
- 自动检测是否启用了密码认证
- 如果未设置用户名和密码，系统将跳过认证
- 支持登录、登出、用户信息获取

### 2. 页面保护
- 全局中间件自动保护所有页面（除登录页面外）
- 未登录用户访问受保护页面时自动重定向到登录页面
- 已登录用户访问登录页面时自动重定向到首页

### 3. API 保护
- 服务器端中间件保护所有 API 路由（除认证相关和配置接口外）
- 未认证的 API 请求将返回 401 错误

## 使用方法

### 1. 启用认证
设置环境变量后重启应用：
```bash
# 设置环境变量
export NUXT_AUTH_USERNAME=admin
export NUXT_AUTH_PASSWORD=your_password

# 启动应用
npm run dev
```

### 2. 访问应用
- 访问 `http://localhost:3000` 会自动重定向到登录页面
- 输入配置的用户名和密码进行登录
- 登录成功后可以正常使用所有功能

### 3. 登出
- 点击页面右上角的"登出"按钮
- 登出后会自动重定向到登录页面

## API 端点

### 认证相关 API

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出  
- `GET /api/auth/me` - 获取当前用户信息

### 配置 API

- `GET /api/config` - 获取系统配置（包含认证状态）

## 安全注意事项

1. **密码安全**：请使用强密码，避免使用简单密码
2. **环境变量**：不要将包含密码的 `.env` 文件提交到版本控制系统
3. **HTTPS**：生产环境建议使用 HTTPS 传输
4. **会话管理**：系统使用基于 cookie 的会话管理

## 故障排除

### 1. 无法登录
- 检查环境变量是否正确设置
- 确认用户名和密码是否匹配
- 查看浏览器控制台和服务器日志

### 2. 页面无限重定向
- 检查全局中间件配置
- 确认 API 端点是否正常响应

### 3. API 请求被拒绝
- 确认已正确登录
- 检查服务器端中间件配置

## 开发说明

### 文件结构
```
server/
├── api/auth/           # 认证相关 API
├── middleware/         # 服务器端中间件
└── utils/env-config.ts # 环境配置管理

app/
├── pages/login.vue     # 登录页面
├── composables/useAuth.ts # 认证状态管理
└── pages/index.vue     # 主页面（已集成认证状态显示）

middleware/
└── auth.global.ts      # 全局页面保护中间件
```

### 自定义配置
可以通过修改 `server/utils/env-config.ts` 来添加更多认证相关的配置选项。
