# 可选 Token 认证设置指南

## 📋 概述

本项目支持**可选的** Token 认证中间件：
- **默认模式**: 无需认证，可直接访问所有 API
- **认证模式**: 设置 `NUXT_TOKEN` 环境变量后，所有 API 请求需要在 URL 路径中包含正确的 token

这种设计既保证了开箱即用的便利性，又提供了生产环境的安全选项。

## 🔐 Token 配置

### 环境变量设置

#### 默认模式（无认证）
```bash
# 不设置 NUXT_TOKEN 或设置为空字符串
# NUXT_TOKEN=

# 此时所有 API 可直接访问，无需 token
```

#### 认证模式（启用 Token）
```bash
# 设置任意非空字符串作为 token
NUXT_TOKEN=your_secure_token_here

# 例如
NUXT_TOKEN=my_secret_token_2024
```

### Token 要求

#### 默认模式
- **必须性**: 无需 token，直接访问 API
- **格式**: `/api/v2/...`
- **适用场景**: 开发环境、内网部署、个人使用

#### 认证模式
- **必须性**: 所有 API 请求都必须包含 token
- **位置**: Token 必须作为 URL 路径的第一段
- **格式**: `/{token}/api/v2/...`
- **适用场景**: 生产环境、公网部署、多用户访问

## 🚀 API 使用方式

### URL 格式

#### 默认模式（无认证）
```
https://your-domain.com/api/v2/endpoint
```

#### 认证模式（需要 Token）
```
https://your-domain.com/{token}/api/v2/endpoint
```

### 示例请求

#### 默认模式示例
```bash
# 搜索动漫
GET /api/v2/search/anime?keyword=鬼灭之刃

# 搜索剧集
GET /api/v2/search/episodes?anime=鬼灭之刃&episode=1

# 获取弹幕
GET /api/v2/comment/12345

# 番剧匹配
POST /api/v2/match
```

#### 认证模式示例
```bash
# 搜索动漫
GET /{token}/api/v2/search/anime?keyword=鬼灭之刃

# 搜索剧集
GET /{token}/api/v2/search/episodes?anime=鬼灭之刃&episode=1

# 获取弹幕
GET /{token}/api/v2/comment/12345

# 番剧匹配
POST /{token}/api/v2/match
```

### 具体示例

#### 默认模式（域名是 `example.com`）
```bash
# 搜索动漫
curl "https://example.com/api/v2/search/anime?keyword=鬼灭之刃"

# 获取系统配置
curl "https://example.com/api/config"

# 查看日志
curl "https://example.com/api/logs"
```

#### 认证模式（token 是 `my_token_123`，域名是 `example.com`）
```bash
# 搜索动漫
curl "https://example.com/my_token_123/api/v2/search/anime?keyword=鬼灭之刃"

# 获取系统配置
curl "https://example.com/my_token_123/api/config"

# 查看日志
curl "https://example.com/my_token_123/api/logs"
```

## 🛡️ 安全建议

### 开发环境建议

1. **默认模式**: 开发时可使用默认模式，无需配置 token
2. **快速测试**: 直接访问 API，提高开发效率
3. **本地调试**: 适合本地开发和内网测试

### 生产环境建议

1. **启用认证**: 生产环境建议设置 `NUXT_TOKEN` 启用认证
2. **使用强密码**: Token 应该是随机生成的长字符串
3. **定期更换**: 定期更换 token 以提高安全性
4. **保密存储**: 将 token 存储在环境变量中，不要硬编码

### Token 生成建议

```bash
# 使用 openssl 生成随机 token
openssl rand -hex 16

# 或使用 node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# 或使用在线工具生成 UUID
# 例如: a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

## 🔧 中间件功能

### 认证流程

#### 默认模式（无认证）
1. **直接处理**: 请求直接传递给相应的 API 处理器
2. **无验证**: 不进行任何 token 检查
3. **快速响应**: 减少认证开销

#### 认证模式（启用 Token）
1. **检查启用状态**: 判断是否设置了 `NUXT_TOKEN`
2. **路径解析**: 提取 URL 路径中的第一段作为 token
3. **Token 验证**: 与配置的 token 进行比较
4. **路径重写**: 验证成功后，从 URL 中移除 token 部分
5. **请求继续**: 将处理后的请求传递给相应的 API 处理器

### 跳过认证的路径

无论是否启用认证，以下路径始终可以直接访问：
- `/favicon.ico`
- `/robots.txt`
- 根路径 `/`（返回 API 信息和认证状态）

## 📊 系统接口

### 首页信息

```bash
GET https://your-domain.com/
```

返回 API 基本信息、使用说明和认证状态（始终可访问，无需 token）

### 系统配置

#### 默认模式
```bash
GET /api/config
```

#### 认证模式
```bash
GET /{token}/api/config
```

返回系统配置信息，包括认证状态（隐藏敏感数据）

### 日志查看

#### 默认模式
```bash
GET /api/logs
```

#### 认证模式
```bash
GET /{token}/api/logs
```

返回系统日志（纯文本格式）

## 🚨 错误处理

### 常见错误

#### 认证模式下的错误

1. **401 Unauthorized: Invalid token**
   - 原因: Token 不正确
   - 解决: 检查 URL 中的 token 是否与 `NUXT_TOKEN` 环境变量一致

2. **401 Unauthorized: Invalid path - token required**
   - 原因: 启用了认证但 URL 路径格式不正确
   - 解决: 确保使用正确的路径格式 `/{token}/api/...`

3. **500 Internal server error during authentication**
   - 原因: 服务器配置问题
   - 解决: 检查环境变量配置和服务器日志

#### 通用错误

1. **404 Not Found**
   - 原因: API 路径不存在
   - 解决: 检查 API 路径是否正确，访问 `/` 查看可用接口

### 调试建议

1. **检查认证状态**: 访问根路径 `/` 查看当前认证模式
2. **查看系统配置**: 访问 `/api/config` 或 `/{token}/api/config` 查看配置状态
3. **检查环境变量**: 确认 `NUXT_TOKEN` 设置是否正确
4. **查看日志**: 访问日志接口查看详细错误信息
5. **验证路径**: 根据认证状态使用正确的 URL 格式

## 🔄 迁移指南

### 启用认证（从默认模式切换到认证模式）

1. **设置环境变量**: 设置 `NUXT_TOKEN=your_secure_token`
2. **更新客户端**: 修改所有 API 调用，在路径中包含 token
3. **测试验证**: 确保所有功能正常工作
4. **重启应用**: 使环境变量生效

### 禁用认证（从认证模式切换到默认模式）

1. **移除环境变量**: 删除 `NUXT_TOKEN` 或设置为空字符串
2. **更新客户端**: 修改所有 API 调用，移除路径中的 token
3. **测试验证**: 确保所有功能正常工作
4. **重启应用**: 使配置生效

### 客户端代码示例

```javascript
// 检查认证状态
const response = await fetch('https://api.example.com/');
const info = await response.json();
const isAuthEnabled = info.status.tokenAuth === 'enabled';

// 根据认证状态构建 URL
let apiUrl;
if (isAuthEnabled) {
  const token = "your_token_here";
  apiUrl = `https://api.example.com/${token}/api/v2/search/anime?keyword=${keyword}`;
} else {
  apiUrl = `https://api.example.com/api/v2/search/anime?keyword=${keyword}`;
}
```

## 📝 注意事项

1. **开箱即用**: 默认情况下无需任何配置即可使用
2. **灵活配置**: 可根据需要随时启用或禁用认证
3. **性能优化**: 默认模式下无认证开销，认证模式下影响极小
4. **日志记录**: 所有认证相关操作都会记录在日志中
5. **CORS 支持**: 认证中间件同时处理 CORS 请求
6. **动态检测**: 系统会自动检测认证状态，无需手动配置

## 🆘 故障排除

### 常见问题

**Q: 如何知道当前是否启用了认证？**
A: 访问根路径 `/` 查看 `status.tokenAuth` 字段，或访问 `/api/config` 查看详细配置

**Q: 为什么我的 API 请求返回 401 错误？**
A: 如果启用了认证，检查 URL 中是否包含正确的 token，格式应为 `/{token}/api/...`

**Q: 如何在不重启服务的情况下切换认证模式？**
A: 需要重启应用才能使环境变量更改生效

**Q: 默认模式下有安全风险吗？**
A: 默认模式适合开发环境和内网部署，生产环境建议启用认证

**Q: token 可以包含特殊字符吗？**
A: 建议使用字母数字组合，避免 URL 特殊字符

**Q: 如何查看当前配置的 token？**
A: 出于安全考虑，接口不会返回完整的 token，只显示是否设置和长度

---

**版本**: v1.2.0  
**更新时间**: 2025-09-21  
**特性**: 可选 Token 认证，开箱即用
