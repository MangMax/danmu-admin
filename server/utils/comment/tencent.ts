import useLogger from "../../composables/useLogger";
import { httpGet } from "../request-client";
import convertToDanmakuJson from "../convertToDanmakuJson";
import { utils } from '../string-utils';
import type { DanmakuInputObject, DanmakuJson } from '#shared/types/danmuku';

// 类型定义
interface TencentSegmentIndex {
  segment_name: string;
}

interface TencentDanmakuBaseResponse {
  segment_index: Record<string, TencentSegmentIndex>;
}

interface TencentDanmakuItem {
  time_offset: number;
  content: string;
  content_style?: string | {
    color?: string;
    gradient_colors?: string[];
  };
}

interface TencentDanmakuSegmentResponse {
  barrage_list: TencentDanmakuItem[];
}

/**
 * 获取腾讯视频弹幕
 */
export async function fetchTencentVideo(inputUrl: string): Promise<DanmakuJson[]> {
  const logger = useLogger();
  logger.info("开始从本地请求腾讯视频弹幕...", inputUrl);

  // 验证URL格式
  if (!utils.url.isValidUrl(inputUrl)) {
    logger.error("Invalid URL format:", inputUrl);
    return [];
  }

  // 弹幕 API 基础地址
  const api_danmaku_base = "https://dm.video.qq.com/barrage/base/";
  const api_danmaku_segment = "https://dm.video.qq.com/barrage/segment/";

  // 解析 URL 获取 vid
  let vid: string;
  // 1. 尝试从查询参数中提取 vid
  const queryMatch = inputUrl.match(/[?&]vid=([^&]+)/);
  if (queryMatch) {
    vid = queryMatch[1]; // 获取 vid 参数值
  } else {
    // 2. 从路径末尾提取 vid
    const pathParts = inputUrl.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    vid = lastPart.split('.')[0]; // 去除文件扩展名
  }

  logger.info("vid:", vid);

  // 获取页面标题
  let res;
  try {
    res = await httpGet(inputUrl, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
  } catch (error) {
    logger.error("请求页面失败:", error);
    return [];
  }

  // 使用正则表达式提取 <title> 标签内容
  const titleMatch = res.data.match(/<title[^>]*>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].split("_")[0] : "未知标题";
  logger.info("标题:", title);

  // 获取弹幕基础数据
  try {
    res = await httpGet(api_danmaku_base + vid, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    logger.error("请求弹幕基础数据失败:", error);
    return [];
  }

  // 先把 res.data 转成 JSON
  const data: TencentDanmakuBaseResponse = utils.string.safeJsonParse(res.data, res.data);

  // 获取弹幕分段数据
  const promises: Promise<any>[] = [];
  const segmentList = Object.values(data.segment_index);
  for (const item of segmentList) {
    promises.push(
      httpGet(`${api_danmaku_segment}${vid}/${item.segment_name}`, {
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
      const parsedData: TencentDanmakuSegmentResponse = utils.string.safeJsonParse(data, data);
      for (const item of parsedData.barrage_list) {
        const content: DanmakuInputObject = {
          timepoint: 0,	// 弹幕发送时间（秒）
          ct: 1,	// 弹幕类型，1-3 为滚动弹幕、4 为底部、5 为顶端、6 为逆向、7 为精确、8 为高级
          color: 16777215,	//弹幕颜色，RGB 颜色转为十进制后的值，16777215 为白色
          content: "",
        };
        content.timepoint = item.time_offset / 1000;
        if (item.content_style && typeof item.content_style === "string" && item.content_style !== "") {
          try {
            const content_style = JSON.parse(item.content_style);
            // 优先使用渐变色的第一个颜色，否则使用基础色
            if (content_style.gradient_colors && content_style.gradient_colors.length > 0) {
              content.color = parseInt(content_style.gradient_colors[0].replace("#", ""), 16);
            } else if (content_style.color && content_style.color !== "ffffff") {
              content.color = parseInt(content_style.color.replace("#", ""), 16);
            }
          } catch {
            // JSON 解析失败，使用默认白色
          }
        }
        content.content = item.content;
        contents.push(content);
      }
    }
  } catch (error) {
    logger.error("解析弹幕数据失败:", error);
    return [];
  }

  // 返回结果
  return convertToDanmakuJson(contents, "tencent");
}