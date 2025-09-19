# Danmu Admin API 文档

## 📋 概述

本文档详细描述了 Danmu Admin 系统的所有 API 接口，包括请求参数、响应格式和使用示例。

## 🔐 认证

所有API接口都需要在路径中包含有效的token进行认证：

```
/{TOKEN}/api/v2/...
```

默认token为 `87654321`，可通过环境变量 `TOKEN` 进行配置。

## 📚 API接口列表

### 1. 搜索相关接口

#### 1.1 搜索动漫 - `GET /api/v2/search/anime`

根据关键词搜索动漫作品。

**请求参数：**
- `keyword` (string, 必需) - 搜索关键词

**请求示例：**
```http
GET /{TOKEN}/api/v2/search/anime?keyword=进击的巨人
```

**响应格式：**
```json
{
  "errorCode": 0,
  "success": true,
  "errorMessage": "",
  "animes": [
    {
      "animeId": 12345,
      "bangumiId": "12345",
      "animeTitle": "进击的巨人(2013)【动漫】from vod",
      "type": "动漫",
      "typeDescription": "动漫",
      "imageUrl": "https://example.com/image.jpg",
      "startDate": "2013-01-01T00:00:00",
      "episodeCount": 25,
      "rating": 0,
      "isFavorited": true
    }
  ]
}
```

---

#### 1.2 搜索剧集 - `GET /api/v2/search/episodes` 🆕

根据动漫名称搜索具体剧集，支持按集数过滤。

**请求参数：**
- `anime` (string, 必需) - 动漫名称
- `episode` (string, 可选) - 集数过滤条件
  - 数字：搜索指定集数（如 `1`, `12`）
  - `"movie"`：搜索剧场版

**请求示例：**
```http
GET /{TOKEN}/api/v2/search/episodes?anime=进击的巨人&episode=1
GET /{TOKEN}/api/v2/search/episodes?anime=鬼灭之刃&episode=movie
```

**响应格式：**
```json
{
  "errorCode": 0,
  "success": true,
  "errorMessage": "",
  "animes": [
    {
      "animeId": 12345,
      "animeTitle": "进击的巨人(2013)【动漫】from vod",
      "type": "动漫",
      "typeDescription": "动漫",
      "episodes": [
        {
          "episodeId": 10001,
          "episodeTitle": "【bilibili】进击的巨人(2013) 第1集"
        }
      ]
    }
  ]
}
```

**功能特点：**
- 支持模糊匹配动漫标题
- 智能过滤剧场版（包含"电影"、"剧场版"、"movie"关键词）
- 支持精确集数匹配
- 返回符合条件的所有动漫及其剧集

---

### 2. 番剧详情接口

#### 2.1 获取番剧详情 - `GET /api/v2/bangumi/{animeId}`

获取指定动漫的详细信息和剧集列表。

**路径参数：**
- `animeId` (number, 必需) - 动漫ID

**请求示例：**
```http
GET /{TOKEN}/api/v2/bangumi/12345
```

**响应格式：**
```json
{
  "errorCode": 0,
  "success": true,
  "errorMessage": "",
  "bangumi": {
    "animeId": 12345,
    "bangumiId": "12345",
    "animeTitle": "进击的巨人",
    "imageUrl": "https://example.com/image.jpg",
    "isOnAir": true,
    "airDay": 1,
    "isFavorited": true,
    "rating": 0,
    "type": "动漫",
    "typeDescription": "动漫",
    "seasons": [
      {
        "id": "season-12345",
        "airDate": "2013-01-01T00:00:00",
        "name": "Season 1",
        "episodeCount": 25
      }
    ],
    "episodes": [
      {
        "seasonId": "season-12345",
        "episodeId": 10001,
        "episodeTitle": "【bilibili】进击的巨人 第1集",
        "episodeNumber": "1",
        "airDate": "2013-01-01T00:00:00"
      }
    ]
  }
}
```

---

### 3. 弹幕相关接口

#### 3.1 获取弹幕 - `GET /api/v2/comment/{commentId}`

获取指定剧集的弹幕数据。

**路径参数：**
- `commentId` (number, 必需) - 剧集ID（对应episodeId）

**请求示例：**
```http
GET /{TOKEN}/api/v2/comment/10001
```

**响应格式：**
```json
{
  "count": 1500,
  "comments": [
    {
      "cid": 1,
      "p": "12.34,1,16777215,[bilibili]",
      "m": "这里是弹幕内容"
    }
  ]
}
```

**弹幕格式说明：**
- `cid`: 弹幕唯一ID
- `p`: 弹幕属性字符串，格式为 `时间,类型,颜色,[平台]`
  - 时间：弹幕出现的时间点（秒）
  - 类型：1-3滚动弹幕，4底部，5顶端
  - 颜色：RGB颜色的十进制值
  - 平台：弹幕来源平台
- `m`: 弹幕文本内容

**支持的平台：**
- Bilibili (B站)
- 爱奇艺 (iQiyi)
- 腾讯视频 (Tencent)
- 芒果TV (Mango)
- 优酷 (Youku)
- 人人视频 (RenRen)
- 第三方服务器兜底

---

### 4. 匹配接口

#### 4.1 弹幕匹配 - `POST /api/v2/match`

根据文件名智能匹配对应的动漫剧集。

**请求体：**
```json
{
  "fileName": "Attack on Titan S01E01"
}
```

**请求示例：**
```http
POST /{TOKEN}/api/v2/match
Content-Type: application/json

{
  "fileName": "进击的巨人 S01E01"
}
```

**响应格式：**
```json
{
  "errorCode": 0,
  "success": true,
  "errorMessage": "",
  "isMatched": true,
  "matches": [
    {
      "episodeId": 10001,
      "animeId": 12345,
      "animeTitle": "进击的巨人",
      "episodeTitle": "第1集",
      "type": "动漫",
      "typeDescription": "动漫",
      "shift": 0,
      "imageUrl": "https://example.com/image.jpg"
    }
  ]
}
```

**文件名解析规则：**
- 支持 `S{season}E{episode}` 格式（如 `S01E01`）
- 自动提取动漫名称、季数、集数信息
- 智能匹配最佳结果

---

### 5. 系统接口

#### 5.1 获取日志 - `GET /api/logs`

获取系统运行日志，用于调试和监控。

**请求示例：**
```http
GET /{TOKEN}/api/logs
```

**响应格式：**
```
[2025-09-19T10:30:00.000Z] info: 开始获取弹幕: https://www.bilibili.com/video/BV1xx411c7mD
[2025-09-19T10:30:01.234Z] info: 弹幕获取完成 [bilibili]: 1500条, 耗时: 1234ms
```

---

## 🔧 错误处理

所有接口都遵循统一的错误响应格式：

```json
{
  "errorCode": 400,
  "success": false,
  "errorMessage": "具体错误描述"
}
```

**常见错误码：**
- `400`: 请求参数错误
- `401`: 认证失败（token无效）
- `404`: 资源未找到
- `500`: 服务器内部错误

## 🚀 使用示例

### 完整的弹幕获取流程

```javascript
// 1. 搜索动漫
const searchResponse = await fetch('/{TOKEN}/api/v2/search/anime?keyword=进击的巨人');
const searchData = await searchResponse.json();
const anime = searchData.animes[0];

// 2. 获取番剧详情
const bangumiResponse = await fetch(`/{TOKEN}/api/v2/bangumi/${anime.animeId}`);
const bangumiData = await bangumiResponse.json();
const episode = bangumiData.bangumi.episodes[0];

// 3. 获取弹幕
const commentResponse = await fetch(`/{TOKEN}/api/v2/comment/${episode.episodeId}`);
const commentData = await commentResponse.json();
console.log(`获取到 ${commentData.count} 条弹幕`);
```

### 智能匹配示例

```javascript
// 根据文件名匹配弹幕
const matchResponse = await fetch('/{TOKEN}/api/v2/match', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fileName: 'Attack on Titan S01E01.mkv' })
});

const matchData = await matchResponse.json();
if (matchData.isMatched) {
  const match = matchData.matches[0];
  // 直接获取匹配的弹幕
  const commentResponse = await fetch(`/{TOKEN}/api/v2/comment/${match.episodeId}`);
}
```

## 📝 注意事项

1. **速率限制**: 建议控制请求频率，避免对源站造成压力
2. **缓存机制**: 系统内置缓存，相同请求在短时间内会返回缓存结果
3. **平台兼容**: 完全兼容弹弹play客户端的API格式
4. **错误恢复**: 内置第三方服务器兜底机制，提高弹幕获取成功率

---

**文档版本**: v1.0  
**最后更新**: 2025-09-19  
**API版本**: v2
