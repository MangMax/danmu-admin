/**
 * Bilibili 弹幕获取模块
 * 支持普通投稿视频(av,bv)和番剧视频(ep)
 */

import { httpGet } from '@@/server/utils/request-client';
import useLogger from '~~/server/composables/useLogger';

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
  // 手动解析 URL（没有 URL 对象的情况下）
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

  let danmakuUrl: string | undefined;

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
        videoInfoUrl = `${api_video_info}?aid=${path[2].substring(2)}`;
      }

      const res = await httpGet(videoInfoUrl, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (data.code !== 0) {
        logger.error("获取普通投稿视频信息失败:", data.message);
        return [];
      }

      const cid = data.data.pages[p - 1].cid;
      danmakuUrl = `https://comment.bilibili.com/${cid}.xml`;
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

      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      if (data.code !== 0) {
        logger.error("获取番剧视频信息失败:", data.message);
        return [];
      }

      let found = false;
      for (const episode of data.result.episodes) {
        if (episode.id == epid) {
          const cid = episode.cid;
          danmakuUrl = `https://comment.bilibili.com/${cid}.xml`;
          found = true;
          break;
        }
      }

      if (!found) {
        logger.error("未找到匹配的番剧集信息");
        return [];
      }

    } catch (error) {
      logger.error("请求番剧视频信息失败:", error);
      return [];
    }

  } else {
    logger.warn("不支持的B站视频网址，仅支持普通视频(av,bv)、剧集视频(ep)");
    return [];
  }

  if (!danmakuUrl) {
    logger.warn("未能获取到弹幕URL");
    return [];
  }

  const response = await httpGet(danmakuUrl, {
    headers: {
      "Content-Type": "application/xml",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  const contents = response.data;
  logger.info(contents);

  return convertToDanmakuJson(contents, "bilibili");
}

// 导出日志缓冲区供调试使用
export { logBuffer };
