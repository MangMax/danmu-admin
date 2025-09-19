# 弹幕类型定义说明

## 类型结构优化

为了避免类型冲突，我们将弹幕相关的类型进行了重新组织：

### 输入类型（原始数据）

#### `DanmakuInputObject` (danmuku.ts)
```typescript
interface DanmakuInputObject {
  timepoint: number; // 时间点（秒）
  size?: number; // 大小（可选）
  ct?: number; // 类型（可选，默认为 0）
  color?: number; // 颜色（可选，默认为 16777215）
  unixtime?: number; // Unix 时间戳（可选）
  content: string; // 内容
  uid?: number; // 用户 ID（可选）
}
```
- **用途**: 表示从各平台获取的原始弹幕数据
- **使用场景**: 在 `convertToDanmakuJson.ts` 和各平台的弹幕获取函数中

#### `BilibiliDanmakuInput` (danmuku.ts)
```typescript
interface BilibiliDanmakuInput {
  p: string; // XML 属性字符串
  m: string; // 弹幕内容
}
```
- **用途**: B站弹幕的输入格式

### 输出类型（转换后数据）

#### `DanmakuJson` (danmuku.ts)
```typescript
interface DanmakuJson {
  p: string; // 属性字符串，如 "10.50,1,16777215,[platform]"
  m: string; // 弹幕内容
  cid: number; // 唯一 ID
}
```
- **用途**: 转换后的标准弹幕格式
- **使用场景**: API 响应、前端显示

#### `DanmakuOutputObject` (data.ts)
```typescript
interface DanmakuOutputObject {
  p: string; // 属性字符串，格式：时间,类型,颜色,[平台]
  m: string; // 弹幕内容
  cid: number; // 弹幕ID
}
```
- **用途**: 与 `DanmakuJson` 相同，但保留在 `data.ts` 中用于向后兼容

### 平台特定类型

#### 腾讯视频
```typescript
interface TencentDanmakuItem {
  time_offset: number;
  content: string;
  content_style?: {
    color?: string;
  };
}
```

#### 爱奇艺
```typescript
interface IqiyiDanmakuData {
  danmaku: string[];
  showTime: string[];
  color: string[];
}
```

#### 芒果TV
```typescript
interface MangoDanmakuItem {
  time: number;
  content: string;
  uid: string;
}
```

#### 优酷
```typescript
interface YoukuDanmakuItem {
  playat: number;
  content: string;
  propertis?: string; // JSON字符串
}
```

#### 人人视频
```typescript
interface RenrenDanmakuItem {
  d: string; // 弹幕内容
  p: string; // 属性字符串
}
```

## 数据流程

```
原始数据 → DanmakuInputObject → convertToDanmakuJson() → DanmakuJson → API响应
```

1. **获取阶段**: 各平台返回原始数据，转换为 `DanmakuInputObject`
2. **转换阶段**: `convertToDanmakuJson()` 将输入对象转换为 `DanmakuJson`
3. **输出阶段**: API 返回 `DanmakuJson[]` 格式的弹幕数据

## 使用建议

- **新代码**: 使用 `DanmakuInputObject` 和 `DanmakuJson`
- **兼容性**: `DanmakuOutputObject` 保留用于向后兼容
- **平台开发**: 参考各平台特定的类型定义
