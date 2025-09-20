/**
 * Bilibili 弹幕获取模块
 * 支持普通投稿视频(av,bv)和番剧视频(ep)
 */

import { httpGet } from '../../request-client';
import useLogger from '~~/server/composables/useLogger';
import convertToDanmakuJson from '../../convertToDanmakuJson';
import { utils } from '../../string-utils';
import { config } from '../../env-config';
import { parseDanmakuBase64 } from '../../bilibili-utils';
import type { DanmakuJson } from '#shared/types/danmuku';

// 日志存储，最多保存 500 行
const logBuffer: Array<{ timestamp: string; level: string; message: string }> = [];


const logger = useLogger()

/**
 * 获取Bilibili弹幕
 * @param inputUrl B站视频URL
 * @returns 弹幕数据数组
 */
export async function fetchBilibili(inputUrl: string): Promise<DanmakuJson[]> {
  logger.info("开始从本地请求B站弹幕...", inputUrl);

  // 弹幕和视频信息 API 基础地址
  const api_video_info = "https://api.bilibili.com/x/web-interface/view";
  const api_epid_cid = "https://api.bilibili.com/pgc/view/web/season";

  // 解析 URL 获取必要参数
  const regex = /^(https?:\/\/[^/]+)(\/[^?#]*)/;
  const match = inputUrl.match(regex);

  let path: string[];
  if (match) {
    path = match[2].split('/').filter(Boolean);  // 分割路径并去掉空字符串
    path.unshift("");
    logger.info(path);
  } else {
    logger.error('Invalid URL');
    return [];
  }

  let cid: number | undefined;
  let aid: string | undefined;
  let duration: number | undefined;

  // 普通投稿视频
  if (inputUrl.includes("video/")) {
    try {
      // 获取查询字符串部分（从 `?` 开始的部分）
      const queryString = inputUrl.split('?')[1];

      // 如果查询字符串存在，则查找参数 p
      let p = 1; // 默认值为 1
      if (queryString) {
        const params = queryString.split('&'); // 按 `&` 分割多个参数
        for (let param of params) {
          const [key, value] = param.split('='); // 分割每个参数的键值对
          if (key === 'p') {
            p = parseInt(value) || 1; // 如果找到 p，使用它的值，否则使用默认值
          }
        }
      }
      logger.info("p: ", p);

      let videoInfoUrl: string;
      if (inputUrl.includes("BV")) {
        videoInfoUrl = `${api_video_info}?bvid=${path[2]}`;
      } else {
        aid = path[2].substring(2);
        videoInfoUrl = `${api_video_info}?aid=${path[2].substring(2)}`;
      }

      const res = await httpGet(videoInfoUrl, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const data = utils.string.safeJsonParse(res.data, res.data);
      if (data.code !== 0) {
        logger.error("获取普通投稿视频信息失败:", data.message);
        return [];
      }

      duration = data.data.duration;
      cid = data.data.pages[p - 1].cid;
    } catch (error) {
      logger.error("请求普通投稿视频信息失败:", error);
      return [];
    }

    // 番剧
  } else if (inputUrl.includes("bangumi/") && inputUrl.includes("ep")) {
    try {
      const epid = path.slice(-1)[0].slice(2);
      const epInfoUrl = `${api_epid_cid}?ep_id=${epid}`;

      const res = await httpGet(epInfoUrl, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const data = utils.string.safeJsonParse(res.data, res.data);
      if (data.code !== 0) {
        logger.error("获取番剧视频信息失败:", data.message);
        return [];
      }

      for (const episode of data.result.episodes) {
        if (episode.id == epid) {
          cid = episode.cid;
          duration = episode.duration / 1000;
          break;
        }
      }

      if (!cid) {
        logger.error("未找到匹配的番剧集信息");
        return [];
      }

    } catch (error) {
      logger.error("请求番剧视频信息失败:", error);
      return [];
    }

  } else {
    logger.error("不支持的B站视频网址，仅支持普通视频(av,bv)、剧集视频(ep)");
    return [];
  }

  if (!cid || !duration) {
    logger.error("未能获取到必要的视频信息");
    return [];
  }

  logger.info("cid:", cid, "aid:", aid, "duration:", duration);

  // 计算视频的分片数量
  const maxLen = Math.floor(duration / 360) + 1;
  logger.info("maxLen:", maxLen);

  const segmentList: Array<{
    segment_start: number;
    segment_end: number;
    url: string;
  }> = [];

  for (let i = 0; i < maxLen; i += 1) {
    let danmakuUrl: string;
    if (aid) {
      danmakuUrl = `https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=${cid}&pid=${aid}&segment_index=${i + 1}`;
    } else {
      danmakuUrl = `https://api.bilibili.com/x/v2/dm/web/seg.so?type=1&oid=${cid}&segment_index=${i + 1}`;
    }

    segmentList.push({
      segment_start: i * 360 * 1000,
      segment_end: (i + 1) * 360 * 1000,
      url: danmakuUrl,
    });
  }

  // 获取Bilibili Cookie配置
  const bilibiliCookie = await config.getBilibiliCookie();

  // 使用 Promise.all 并行请求所有分片
  try {
    const allComments = await Promise.all(
      segmentList.map(async (segment) => {
        logger.info("正在请求弹幕数据...", segment.url);
        try {
          // 请求单个分片的弹幕数据
          const res = await httpGet(segment.url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              ...(bilibiliCookie && { "Cookie": bilibiliCookie })
            },
          });

          // 解析 Base64 数据
          return parseDanmakuBase64(res.data);
        } catch (error) {
          logger.error("请求弹幕数据失败:", error);
          return [];
        }
      })
    );

    // 合并所有分片的弹幕数据
    const mergedComments = allComments.flat();
    return convertToDanmakuJson(mergedComments, "bilibili");

  } catch (error) {
    logger.error("获取所有弹幕数据时出错:", error);
    return [];
  }
}

// 导出日志缓冲区供调试使用
export { logBuffer };
