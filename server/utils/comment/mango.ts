import useLogger from "../../composables/useLogger";
import { httpGet } from "../request-client";
import convertToDanmakuJson from "../convertToDanmakuJson";
import { utils } from '../string-utils';
import type { DanmakuInputObject, DanmakuJson } from '#shared/types/danmuku';

// 类型定义
interface MangoVideoInfo {
  info: {
    videoName: string;
    time: string;
  };
}

interface MangoDanmakuItem {
  time: number;
  content: string;
  uid: string;
}

interface MangoDanmakuResponse {
  data: {
    items: MangoDanmakuItem[];
  };
}

// 使用统一的时间工具函数
// time_to_second 函数已移至 utils.time.timeToSeconds

/**
 * 获取芒果TV弹幕
 */
export async function fetchMangoTV(inputUrl: string): Promise<DanmakuJson[]> {
  const logger = useLogger();
  logger.info("开始从本地请求芒果TV弹幕...", inputUrl);

  // 验证URL格式
  if (!utils.url.isValidUrl(inputUrl)) {
    logger.error("Invalid URL format:", inputUrl);
    return [];
  }

  // 弹幕和视频信息 API 基础地址
  const api_video_info = "https://pcweb.api.mgtv.com/video/info";
  const api_danmaku = "https://galaxy.bz.mgtv.com/rdbarrage";

  // 解析 URL 获取 cid 和 vid
  const regex = /^(https?:\/\/[^/]+)(\/[^?#]*)/;
  const match = inputUrl.match(regex);

  let path: string[];
  if (match) {
    path = match[2].split('/').filter(Boolean);
    logger.info("path:", path);
  } else {
    logger.error('Invalid URL');
    return [];
  }
  const cid = path[path.length - 2];
  const vid = path[path.length - 1].split(".")[0];

  logger.info("cid:", cid, "vid:", vid);

  // 获取页面标题和视频时长
  let res;
  try {
    const videoInfoUrl = `${api_video_info}?cid=${cid}&vid=${vid}`;
    res = await httpGet(videoInfoUrl, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
  } catch (error) {
    logger.info("请求视频信息失败:", error);
    return [];
  }

  const data = utils.string.safeJsonParse(res.data, res.data);
  const videoInfo: MangoVideoInfo = data.data;
  const title = videoInfo.info.videoName;
  const time = videoInfo.info.time;
  logger.info("标题:", title);

  // 计算弹幕分段请求
  const step = 60 * 1000; // 每60秒一个分段
  const end_time = utils.time.timeToSeconds(time) * 1000; // 将视频时长转换为毫秒
  const promises: Promise<any>[] = [];
  for (let i = 0; i < end_time; i += step) {
    const danmakuUrl = `${api_danmaku}?vid=${vid}&cid=${cid}&time=${i}`;
    promises.push(
      httpGet(danmakuUrl, {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
    );
  }

  logger.info("弹幕分段数量:", promises.length);

  // 解析弹幕数据
  const contents: DanmakuInputObject[] = [];
  try {
    const results = await Promise.allSettled(promises);
    const datas = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<any>).value.data);

    for (const data of datas) {
      const dataJson: MangoDanmakuResponse = utils.string.safeJsonParse(data, data);
      if (!dataJson.data.items) continue;
      for (const item of dataJson.data.items) {
        const content: DanmakuInputObject = {
          timepoint: 0,	// 弹幕发送时间（秒）
          ct: 1,	// 弹幕类型，1-3 为滚动弹幕、4 为底部、5 为顶端、6 为逆向、7 为精确、8 为高级
          color: 16777215,	//弹幕颜色，RGB 颜色转为十进制后的值，16777215 为白色
          content: "",
        };
        content.timepoint = item.time / 1000;
        content.content = item.content;
        contents.push(content);
      }
    }
  } catch (error) {
    logger.error("解析弹幕数据失败:", error);
    return [];
  }

  // 返回结果
  return convertToDanmakuJson(contents, "mango");
}