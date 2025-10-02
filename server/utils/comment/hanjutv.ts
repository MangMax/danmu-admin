/**
 * 韩剧TV弹幕获取模块
 * 基于 danmu_v1.2.0.js 中的真实实现
 */

import useLogger from '../../composables/useLogger';
import { httpGet } from '../request-client';

const logger = useLogger();

/**
 * 韩剧TV弹幕原始数据项
 */
interface HanjutvDanmakuItem {
  did: string | number;
  t: number;      // 时间
  tp: number;     // 类型
  sc: string | number;    // 颜色/分数
  con: string;    // 内容
}

/**
 * 获取韩剧TV集数的弹幕
 * 使用分页获取所有弹幕
 */
async function fetchHanjutvEpisodeDanmu(sid: string): Promise<HanjutvDanmakuItem[]> {
  let allDanmus: HanjutvDanmakuItem[] = [];
  let fromAxis = 0;
  const maxAxis = 100000000;

  try {
    while (fromAxis < maxAxis) {
      const resp = await httpGet(`https://hxqapi.zmdcq.com/api/danmu/playItem/list?fromAxis=${fromAxis}&pid=${sid}&toAxis=${maxAxis}`, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      // 将当前请求的弹幕拼接到总数组
      if (resp.data && resp.data.danmus) {
        allDanmus = allDanmus.concat(resp.data.danmus);
      }

      // 获取 nextAxis，更新 fromAxis
      const nextAxis = resp.data.nextAxis || maxAxis;
      if (nextAxis >= maxAxis) {
        break; // 如果 nextAxis 达到或超过最大值，退出循环
      }
      fromAxis = nextAxis;
    }

    return allDanmus;
  } catch (error) {
    // 捕获请求中的错误
    logger.error('fetchHanjutvEpisodeDanmu error:', error);
    return allDanmus; // 返回已收集的弹幕
  }
}

/**
 * 格式化韩剧TV弹幕数据
 * 转换为统一的弹幕格式
 */
function formatHanjutvComments(items: HanjutvDanmakuItem[]): DanmakuJson[] {
  return items.map(c => ({
    cid: Number(c.did),
    p: `${(c.t / 1000).toFixed(2)},${c.tp},${Number(c.sc)},[hanjutv]`,
    m: c.con,
    t: Math.round(c.t / 1000)
  }));
}

/**
 * 获取韩剧TV弹幕（主入口函数）
 * @param pid 视频ID
 * @returns 格式化后的弹幕数据
 */
export async function fetchHanjuTV(pid: string): Promise<DanmakuJson[]> {
  logger.info('开始获取韩剧TV弹幕:', pid);

  try {
    const raw = await fetchHanjutvEpisodeDanmu(pid);
    logger.info(`原始弹幕 ${raw.length} 条，正在规范化`);

    const formatted = formatHanjutvComments(raw);
    logger.info(`弹幕处理完成，共 ${formatted.length} 条`);

    // 输出前五条弹幕用于调试
    if (formatted.length > 0) {
      logger.info('Top 5 danmus:', JSON.stringify(formatted.slice(0, 5), null, 2));
    }

    return formatted;
  } catch (error) {
    logger.error('获取韩剧TV弹幕失败:', error);
    return [];
  }
}
