import useLogger from "../../composables/useLogger";
import { httpGet } from "../request-client";
import convertToDanmakuJson from "../convertToDanmakuJson";
import { utils } from '../string-utils';
import { CryptoUtils } from '../crypto-utils';

// 类型定义
interface IqiyiVideoInfo {
  name?: string;
  tvName?: string;
  durationSec: number;
  albumId: string;
  channelId?: string;
  categoryId?: string;
}

export interface IqiyiDecodeData {
  data: string;
}

export interface IqiyiDanmakuItem {
  timepoint: number;
  ct: number;
  size: number;
  color: number;
  unixtime: number;
  uid: number;
  content: string;
}

function extract(xml: string, tag: string): string[] {
  const reg = new RegExp(`<${tag}>(.*?)</${tag}>`, "g");
  const matches = xml.match(reg);
  return matches ? matches.map(match => match.substring(tag.length + 2, match.length - tag.length - 3)) : [];
}

/**
 * 获取爱奇艺弹幕
 */
export async function fetchIqiyi(inputUrl: string): Promise<DanmakuJson[]> {
  const logger = useLogger();
  logger.info("开始从本地请求爱奇艺弹幕...", inputUrl);

  // 验证URL格式
  if (!utils.url.isValidUrl(inputUrl)) {
    logger.error("Invalid URL format:", inputUrl);
    return [];
  }

  // 弹幕 API 基础地址
  const api_decode_base = "https://pcw-api.iq.com/api/decode/";
  const api_video_info = "https://pcw-api.iqiyi.com/video/video/baseinfo/";
  const api_danmaku_base = "https://cmts.iqiyi.com/bullet/";

  // 解析 URL 获取 tvid
  let tvid: string;
  try {
    const idMatch = inputUrl.match(/v_(\w+)/);
    if (!idMatch) {
      logger.error("无法从 URL 中提取 tvid");
      return [];
    }
    tvid = idMatch[1];
    logger.info("tvid:", tvid);

    // 获取 tvid 的解码信息
    const decodeUrl = `${api_decode_base}${tvid}?platformId=3&modeCode=intl&langCode=sg`;
    const res = await httpGet(decodeUrl, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const data: IqiyiDecodeData = utils.string.safeJsonParse(res.data, res.data);
    tvid = data.data.toString();
    logger.info("解码后 tvid:", tvid);
  } catch (error) {
    logger.error("请求解码信息失败:", error);
    return [];
  }

  // 获取视频基础信息
  let title: string, duration: number, albumid: string, categoryid: string;
  try {
    const videoInfoUrl = `${api_video_info}${tvid}`;
    const res = await httpGet(videoInfoUrl, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    const data = utils.string.safeJsonParse(res.data, res.data);
    const videoInfo: IqiyiVideoInfo = data.data;
    title = videoInfo.name || videoInfo.tvName || "未知标题";
    duration = videoInfo.durationSec;
    albumid = videoInfo.albumId;
    categoryid = videoInfo.channelId || videoInfo.categoryId || "";
    logger.info("标题:", title, "时长:", duration);
  } catch (error) {
    logger.error("请求视频基础信息失败:", error);
    return [];
  }

  // 计算弹幕分段数量（每5分钟一个分段）
  const page = Math.ceil(duration / (60 * 5));
  logger.info("弹幕分段数量:", page);

  // 构建弹幕请求
  const promises: Promise<any>[] = [];
  for (let i = 0; i < page; i++) {
    const params = {
      rn: "0.0123456789123456",
      business: "danmu",
      is_iqiyi: "true",
      is_video_page: "true",
      tvid: tvid,
      albumid: albumid,
      categoryid: categoryid,
      qypid: "01010021010000000000",
    };
    const queryParams = CryptoUtils.buildQueryString(params);
    const api_url = `${api_danmaku_base}${tvid.slice(-4, -2)}/${tvid.slice(-2)}/${tvid}_300_${i + 1}.z?${queryParams}`;
    promises.push(
      httpGet(api_url, {
        headers: {
          "Accpet-Encoding": "gzip",
          "Content-Type": "application/xml",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        zlibMode: true
      })
    );
  }

  // 解析弹幕数据
  const contents: IqiyiDanmakuItem[] = [];
  try {
    const results = await Promise.allSettled(promises);
    const datas = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<any>).value);

    for (const data of datas) {
      const xml = data.data;

      // 解析 XML 数据
      const danmaku = extract(xml, "content");
      const showTime = extract(xml, "showTime");
      const color = extract(xml, "color");
      const step = 1;

      for (let i = 0; i < danmaku.length; i += step) {
        const content: IqiyiDanmakuItem = {
          timepoint: 0,	// 弹幕发送时间（秒）
          ct: 1,	// 弹幕类型，1-3 为滚动弹幕、4 为底部、5 为顶端、6 为逆向、7 为精确、8 为高级
          size: 25,	//字体大小，25 为中，18 为小
          color: 16777215,	//弹幕颜色，RGB 颜色转为十进制后的值，16777215 为白色
          unixtime: Math.floor(Date.now() / 1000),	//Unix 时间戳格式
          uid: 0,		//发送人的 id
          content: "",
        };
        content.timepoint = parseFloat(showTime[i]);
        content.color = parseInt(color[i], 16);
        content.content = danmaku[i];
        content.size = 25;
        contents.push(content);
      }
    }
  } catch (error) {
    logger.error("解析弹幕数据失败:", error);
    return [];
  }

  // 返回结果
  return convertToDanmakuJson(contents, "iqiyi");
}