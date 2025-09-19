# 弹幕API兼容性说明

本项目基于原有的弹幕API系统进行了现代化改造，同时保持与原系统的完全兼容性。

## 🔄 兼容性保证

### 1. API 端点兼容

所有原有的API端点均保持不变：

```
GET  /api/v2/search/anime          # 搜索动漫
GET  /api/v2/search/episodes       # 搜索集数
POST /api/v2/match                 # 匹配动漫
GET  /api/v2/bangumi/:animeId      # 获取番剧详情
GET  /api/v2/comment/:commentId    # 获取弹幕
GET  /api/logs                     # 获取日志
```

### 2. 数据格式兼容

所有API返回的数据格式与原系统完全一致，不会破坏现有的客户端集成。

### 3. 配置兼容

原有的 `danmu.js` 文件仍然保留，确保现有功能正常运行。新的配置系统作为增强功能存在。

## 🚀 新增功能

### 1. 环境变量配置

```bash
# 复制配置示例
cp .env.example .env

# 编辑配置
NUXT_TOKEN=your_custom_token
NUXT_OTHER_SERVER=https://your-danmu-server.com
```

### 2. 配置信息API

新增配置查看端点：
```
GET /api/config    # 查看当前配置状态
```

### 3. 可视化配置面板

在主页面新增配置信息展示，方便调试和监控。

## ⚙️ 配置优先级

1. **环境变量** (最高优先级)
   - `NUXT_TOKEN`
   - `NUXT_OTHER_SERVER`
   - `NUXT_VOD_SERVER`

2. **nuxt.config.ts 默认值** (中等优先级)

3. **danmu.js 硬编码值** (最低优先级，兼容性保证)

## 🛠️ 迁移建议

### 立即可用
项目开箱即用，无需任何配置更改。

### 渐进式迁移
如需使用新配置功能：

1. **第一步**: 复制 `.env.example` 为 `.env`
2. **第二步**: 根据需要修改环境变量
3. **第三步**: 重启服务

### 开发环境
```bash
# 开发环境启动
npm run dev

# 查看配置状态
curl http://localhost:3000/api/config
```

### 生产环境
```bash
# 设置生产环境变量
export NODE_ENV=production
export NUXT_TOKEN=your_production_token

# 构建并启动
npm run build
npm run preview
```

## 📊 配置对比

| 功能 | 原系统 | 新系统 |
|------|--------|--------|
| 基本功能 | ✅ 支持 | ✅ 完全兼容 |
| 硬编码配置 | ✅ 是 | ✅ 保留支持 |
| 环境变量 | ❌ 不支持 | ✅ 完全支持 |
| 类型安全 | ❌ 无 | ✅ TypeScript |
| 热重载 | ❌ 需重启 | ✅ 自动更新 |
| 配置验证 | ❌ 无 | ✅ 自动验证 |
| 可视化 | ❌ 无 | ✅ Web界面 |

## 🔍 故障排除

### 配置未生效
1. 检查环境变量名称（必须以 `NUXT_` 开头）
2. 重启开发服务器
3. 访问 `/api/config` 查看当前配置

### 兼容性问题
如果遇到兼容性问题，系统会自动回退到原有的 `danmu.js` 配置。

### 调试模式
```bash
# 启用详细日志
export NODE_ENV=development

# 查看配置调试信息
curl http://localhost:3000/api/config
```

## 📚 相关文档

- [CONFIG_MIGRATION.md](./CONFIG_MIGRATION.md) - 详细的配置系统迁移指南
- [.env.example](./.env.example) - 环境变量配置示例
- [README.md](./README.md) - 项目总体说明

## 🤝 技术支持

如有任何兼容性问题或疑问，请：

1. 检查 `/api/config` 端点状态
2. 查看服务器日志 `/api/logs`
3. 参考配置文档进行排查

本次升级确保了**零破坏性变更**，所有现有功能均正常运行。
