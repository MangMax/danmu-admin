/**
 * 原始 danmu.js 中使用的数据结构类型定义
 */

/**
 * 动漫信息（存储在 animes 数组中）
 */
export interface AnimeData {
  animeId: number;
  bangumiId: string;
  animeTitle: string;
  type: string;
  typeDescription: string;
  imageUrl: string;
  startDate: string;
  episodeCount: number;
  rating: number;
  isFavorited: boolean;
  links: EpisodeLink[];
}

/**
 * 剧集链接信息（存储在 episodeIds 数组中）
 */
export interface EpisodeLink {
  id: number;
  url: string;
  title: string;
}

/**
 * 日志条目
 */
export interface LogEntry {
  timestamp: string;
  level: 'log' | 'error' | 'info' | 'warn';
  message: string;
}

/**
 * 360kan 搜索结果
 */
export interface Anime360Result {
  id: string;
  titleTxt: string;
  year: string;
  cat_name: string;
  cover: string;
  playlinks?: Record<string, string>;
  seriesPlaylinks?: Array<{ url: string; name: string }>;
  seriesSite?: string;
  playlinks_year?: Record<string, string[]>;
}

/**
 * VOD 搜索结果
 */
export interface VodAnimeResult {
  vod_id: string;
  vod_name: string;
  vod_year: string;
  type_name: string;
  vod_pic: string;
  vod_play_from: string;
  vod_play_url: string;
}

/**
 * 人人视频搜索结果
 */
export interface RenrenAnimeResult {
  provider: string;
  mediaId: string;
  title: string;
  type: string;
  season: number | null;
  year: string;
  imageUrl: string;
  episodeCount: number;
  currentEpisodeIndex: number | null;
}

/**
 * 弹幕内容（原始格式）
 */
export interface DanmakuContent {
  timepoint: number;
  ct: number;
  size: number;
  color: number;
  unixtime: number;
  uid: number;
  content: string;
}

/**
 * 转换后的弹幕对象
 */
export interface DanmakuObject {
  p: string; // 属性字符串，格式：时间,类型,颜色,[平台]
  m: string; // 弹幕内容
  cid: number; // 弹幕ID
}

/**
 * 腾讯视频弹幕原始数据
 */
export interface TencentDanmakuItem {
  time_offset: number;
  content: string;
  content_style?: {
    color?: string;
  };
}

/**
 * 爱奇艺弹幕原始数据
 */
export interface IqiyiDanmakuData {
  danmaku: string[];
  showTime: string[];
  color: string[];
}

/**
 * 芒果TV弹幕原始数据
 */
export interface MangoDanmakuItem {
  time: number;
  content: string;
  uid: string;
}

/**
 * B站弹幕原始数据（XML格式）
 */
export interface BilibiliDanmakuItem {
  p: string; // 属性字符串
  m: string; // 弹幕内容
}

/**
 * 优酷弹幕原始数据
 */
export interface YoukuDanmakuItem {
  playat: number;
  content: string;
  propertis?: string; // JSON字符串
}

/**
 * 人人视频弹幕原始数据
 */
export interface RenrenDanmakuItem {
  d: string; // 弹幕内容
  p: string; // 属性字符串
}

/**
 * 环境配置
 */
export interface EnvConfig {
  TOKEN: string;
  OTHER_SERVER: string;
  VOD_SERVER: string;
}

/**
 * HTTP 请求选项
 */
export interface HttpOptions {
  headers?: Record<string, string>;
  base64Data?: boolean;
  zlibMode?: boolean;
  allow_redirects?: boolean;
}

/**
 * HTTP 响应
 */
export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}
