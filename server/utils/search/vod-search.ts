/**
 * VOD站点搜索模块
 * 提供VOD站点的动画信息搜索功能
 */

import { httpGet } from '../request-client';
import useLogger from '~~/server/composables/useLogger';
import { config } from '../env-config';
import { utils } from '../string-utils';

const logger = useLogger();

/**
 * VOD API响应接口
 */
export interface VodResponse {
  list?: VodAnime[];
  code?: number;
  msg?: string;
}

export interface VodAnime {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_year: string;
  type_name: string;
  vod_play_from: string;
  vod_play_url: string;
  vod_remarks: string;
  vod_content: string;
  vod_score: string;
}

// 允许的播放平台（基于原始 danmu.js）
const ALLOWED_PLATFORMS = ["qiyi", "bilibili1", "imgo", "youku", "qq"];

/**
 * 查询VOD站点影片信息
 */
export async function searchVodAnimes(title: string, options: SearchOptions = {}): Promise<AnimeSearchResult[]> {
  try {
    const envConfig = await config.get();
    const vodServer = envConfig.vodServer;

    if (!vodServer) {
      logger.warn('VOD_SERVER未配置，跳过VOD搜索');
      return [];
    }

    logger.info(`开始搜索VOD动画: ${title} from ${vodServer}`);

    const response = await httpGet(
      `${vodServer}/api.php/provide/vod/?ac=detail&wd=${encodeURIComponent(title)}&pg=1`,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: options.timeout || 10000
      }
    );

    const data = utils.string.safeJsonParse(response.data, { list: [] }) as VodResponse;

    // 检查响应数据
    if (!data.list || !Array.isArray(data.list) || data.list.length === 0) {
      logger.info(`VOD搜索成功，但结果为空: ${vodServer}`);
      return [];
    }

    logger.info(`VOD搜索结果数量: ${data.list.length}`);

    // 转换为标准格式（基于原始 danmu.js 逻辑）
    const results: AnimeSearchResult[] = [];

    for (const anime of data.list) {
      const playlinks = parseVodPlaylinks(anime);

      if (playlinks.length === 0) {
        logger.debug(`跳过无有效播放链接的动画: ${anime.vod_name}`);
        continue;
      }

      const result: AnimeSearchResult = {
        provider: 'vod',
        animeId: Number(anime.vod_id),
        bangumiId: anime.vod_id?.toString(),
        animeTitle: `${anime.vod_name}(${anime.vod_year})`,
        type: `${anime.type_name} - vod`,
        typeDescription: `${anime.type_name} - vod`,
        imageUrl: anime.vod_pic,
        startDate: `${anime.vod_year}-01-01T00:00:00`,
        episodeCount: playlinks.length,
        rating: 0, // 原始代码默认使用 0
        isFavorited: true, // 原始代码默认使用 true
        links: playlinks  // 添加播放链接（基于原始 danmu.js）
      };

      results.push(result);
    }

    return results;
  } catch (error) {
    logger.error(`VOD搜索失败: ${error}`);
    return []; // VOD搜索失败不应该影响整体搜索
  }
}

/**
 * 解析VOD播放链接（基于原始 danmu.js 逻辑）
 */
function parseVodPlaylinks(anime: VodAnime): PlayLink[] {
  try {
    let vodPlayFromList = anime.vod_play_from.split("$$$");
    vodPlayFromList = vodPlayFromList.map(item => {
      if (item === "mgtv") {
        return "imgo"; // 将mgtv替换为imgo
      } else if (item === "bilibili") {
        return "bilibili1"; // 将bilibili替换为bilibili1
      } else {
        return item; // 其他情况保持原值
      }
    });

    const vodPlayUrlList = anime.vod_play_url.split("$$$");

    // 过滤出在allowedPlatforms中的元素，并保持它们在vodPlayFromList中的原始索引
    const validIndices = vodPlayFromList
      .map((item, index) => ALLOWED_PLATFORMS.includes(item) ? index : -1)
      .filter(index => index !== -1);

    let links: PlayLink[] = [];
    let count = 0;
    for (const num of validIndices) {
      const platform = vodPlayFromList[num];
      const eps = vodPlayUrlList[num].split("#");
      for (const ep of eps) {
        const epInfo = ep.split("$");
        count = count + 1;
        links.push({
          name: count.toString(),
          url: epInfo[1],
          title: `【${platform}】${anime.vod_name}(${anime.vod_year}) ${epInfo[0]}`,
          platform,
          episode: epInfo[0]
        });
      }
    }

    return links;
  } catch (error) {
    logger.warn(`解析VOD播放链接失败: ${error}`);
    return [];
  }
}

/**
 * 获取VOD动画详细信息
 */
export async function getVodAnimeDetails(animeId: string): Promise<VodAnime | null> {
  try {
    const envConfig = await config.get();
    const vodServer = envConfig.vodServer;

    if (!vodServer) {
      throw new Error('VOD_SERVER未配置');
    }

    logger.info(`获取VOD动画详情: ${animeId}`);

    const response = await httpGet(
      `${vodServer}/api.php/provide/vod/?ac=detail&ids=${animeId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      }
    );

    const data = utils.string.safeJsonParse(response.data, { list: [] }) as VodResponse;

    if (!data.list || data.list.length === 0) {
      logger.warn(`未找到VOD动画详情: ${animeId}`);
      return null;
    }

    return data.list[0];
  } catch (error) {
    logger.error(`获取VOD动画详情失败: ${error}`);
    throw error;
  }
}

/**
 * 验证VOD服务器连接
 */
export async function validateVodServer(serverUrl: string): Promise<boolean> {
  try {
    logger.info(`验证VOD服务器连接: ${serverUrl}`);

    const response = await httpGet(
      `${serverUrl}/api.php/provide/vod/?ac=detail&wd=test&pg=1`,
      {
        timeout: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        }
      }
    );

    const data = utils.string.safeJsonParse(response.data, null);
    return data !== null && typeof data === 'object';
  } catch (error) {
    logger.warn(`VOD服务器连接验证失败: ${serverUrl} - ${error}`);
    return false;
  }
}
