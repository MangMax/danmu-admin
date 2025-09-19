// 定义原始弹幕对象类型（输入格式）
export interface DanmakuInputObject {
  timepoint: number; // 时间点（秒）
  size?: number; // 大小（可选）
  ct?: number; // 类型（可选，默认为 0）
  color?: number; // 颜色（可选，默认为 16777215）
  unixtime?: number; // Unix 时间戳（可选）
  content: string; // 内容
  uid?: number; // 用户 ID（可选）
}

// 定义 Bilibili 格式的弹幕项（数组格式）
export type DanmakuItem = [number, string, string, any, string]; // [timepoint, mode, color, ?, content]

// 定义 contents 的联合类型
export type DanmakuContents =
  | string // XML 字符串格式
  | { danmuku: DanmakuItem[] } // Bilibili 对象格式
  | DanmakuInputObject[]; // 标准对象数组格式

// 定义输出弹幕 JSON 类型
export interface DanmakuJson {
  p: string; // 属性字符串，如 "10.50,1,16777215,[platform]"
  m: string; // 弹幕内容
  cid: number; // 唯一 ID
}

// 新增类型定义（优化 extractToDanmakuJson）
export interface BilibiliDanmakuInput {
  p: string; // XML 属性字符串
  m: string; // 弹幕内容
}

export type DanmakuInputItem = DanmakuInputObject | BilibiliDanmakuInput; // 统一输入项类型

export type DanmakuTypeMap = Record<string, number>; // 类型映射表

export type HexToDecimalFunction = (hex: string) => number; // 十六进制转十进制函数类型