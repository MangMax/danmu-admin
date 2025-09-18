/**
 * Bilibili 弹幕模块使用示例
 */

import { fetchBilibili } from './bilibili';

// 示例：获取B站视频弹幕
export async function getBilibiliDanmu(url: string) {
  try {
    console.log(`正在获取B站弹幕: ${url}`);
    const danmus = await fetchBilibili(url);
    
    if (danmus.length > 0) {
      console.log(`成功获取 ${danmus.length} 条弹幕`);
      console.log('前3条弹幕示例:', danmus.slice(0, 3));
    } else {
      console.log('未获取到弹幕数据');
    }
    
    return danmus;
  } catch (error) {
    console.error('获取B站弹幕失败:', error);
    return [];
  }
}

// 支持的URL格式示例
export const SUPPORTED_URLS = {
  普通视频BV号: 'https://www.bilibili.com/video/BV1xx411c7XD',
  普通视频av号: 'https://www.bilibili.com/video/av123456',
  带分P参数: 'https://www.bilibili.com/video/BV1xx411c7XD?p=2',
  番剧: 'https://www.bilibili.com/bangumi/play/ep123456'
};