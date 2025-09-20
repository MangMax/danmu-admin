/**
 * 360kan 动画搜索模块
 * 提供360kan平台的动画信息搜索功能
 */

import { httpGet } from '../request-client';
import useLogger from '~~/server/composables/useLogger';
import { utils } from '../string-utils';

const logger = useLogger();

// 允许的播放平台（基于原始 danmu.js）
const ALLOWED_PLATFORMS = ["qiyi", "bilibili1", "imgo", "youku", "qq"];

/**
 * 360kan API响应接口
 */
export interface Kan360Response {
  data: {
    longData: {
      rows?: Kan360Anime[];
    };
  };
}

export interface Kan360Anime {
  id: string;
  titleTxt: string;  // 原始代码使用 titleTxt
  cover: string;
  cat_name: string;
  year: string;
  score: number;
  area: string;
  msg: string;
  upinfo: string;
  playlinks?: Record<string, string>;  // 对象，不是数组
  seriesSite?: string;  // 系列站点
  seriesPlaylinks?: Array<{
    url: string;
    name: string;
  }>;  // 系列播放链接数组
  playlinks_year?: Record<string, string[]>;  // 按年份分组的播放链接
}


/**
 * 查询360kan影片信息
 */
export async function search360Animes(title: string, options: SearchOptions = {}): Promise<AnimeSearchResult[]> {
  try {
    logger.info(`开始搜索360kan动画: ${title}`);

    const response = await httpGet(
      `https://api.so.360kan.com/index?force_v=1&kw=${encodeURIComponent(title)}&from=&pageno=1&v_ap=1&tab=all`,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        timeout: options.timeout || 10000
      }
    );

    const data = utils.string.safeJsonParse(response.data, { data: { longData: {} } }) as Kan360Response;
    logger.info("360kan response received");

    let animes: Kan360Anime[] = [];
    if (data.data?.longData?.rows) {
      animes = data.data.longData.rows;
    }

    logger.info(`360kan搜索结果数量: ${animes.length}`);

    // 转换为标准格式（基于原始 danmu.js 逻辑）
    const results: AnimeSearchResult[] = [];

    for (const anime of animes) {
      let links: PlayLink[] = [];

      // 根据类型处理播放链接（完全基于原始逻辑）
      if (anime.cat_name === "电影") {
        for (const key of Object.keys(anime.playlinks || {})) {
          if (ALLOWED_PLATFORMS.includes(key)) {
            links.push({
              name: key,
              url: anime.playlinks![key],
              title: `【${key}】${anime.titleTxt}(${anime.year})`,
              platform: key
            });
          }
        }
      } else if (anime.cat_name === "电视剧" || anime.cat_name === "动漫") {
        if (anime.seriesSite && ALLOWED_PLATFORMS.includes(anime.seriesSite)) {
          for (let i = 0; i < (anime.seriesPlaylinks?.length || 0); i++) {
            const item = anime.seriesPlaylinks![i];
            links.push({
              name: (i + 1).toString(),
              url: item.url,
              title: `【${anime.seriesSite}】${anime.titleTxt}(${anime.year}) ${i + 1}`,
              platform: anime.seriesSite
            });
          }
        }
      } else if (anime.cat_name === "综艺") {
        for (const site of Object.keys(anime.playlinks_year || {})) {
          if (ALLOWED_PLATFORMS.includes(site)) {
            for (const year of anime.playlinks_year![site]) {
              try {
                const subLinks = await get360Zongyi(anime.id, site, year);
                links = links.concat(subLinks);
              } catch (error) {
                logger.warn(`获取综艺详情失败: ${anime.id} - ${error}`);
              }
            }
          }
        }
      }

      const result: AnimeSearchResult = {
        provider: '360kan',
        animeId: Number(anime.id),
        bangumiId: anime.id?.toString(),
        animeTitle: `${anime.titleTxt}(${anime.year})`,
        type: `${anime.cat_name} - 360kan`,
        typeDescription: anime.cat_name,
        imageUrl: anime.cover,
        startDate: `${anime.year}-01-01T00:00:00`,
        episodeCount: links.length,
        rating: 0, // 原始代码默认使用 0
        isFavorited: true, // 原始代码默认使用 true
        links: links  // 添加播放链接（基于原始 danmu.js）
      };

      results.push(result);
    }

    return results;
  } catch (error) {
    logger.error(`360kan搜索失败: ${error}`);
    return [];
  }
}

/**
 * 查询360kan综艺详情（基于原始 danmu.js 的 get360Zongyi 逻辑）
 */
export async function get360Zongyi(entId: string, site: string, year: string): Promise<PlayLink[]> {
  try {
    logger.info(`获取360kan综艺详情: ${entId}`);

    let links: PlayLink[] = [];

    // 分页获取所有集数（最多10页，每页20条）
    for (let j = 0; j <= 10; j++) {
      const response = await httpGet(
        `https://api.so.360kan.com/episodeszongyi?entid=${entId}&site=${site}&y=${year}&count=20&offset=${j * 20}`,
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          }
        }
      );

      const data = response.data;
      logger.info("360kan zongyi response received");

      const episodeList = data?.data?.list;
      if (!episodeList) {
        break;
      }

      for (const episodeInfo of episodeList) {
        links.push({
          name: episodeInfo.id,
          url: episodeInfo.url,
          title: `【${site}】${episodeInfo.name}(${episodeInfo.period})`,
          platform: site
        });
      }

      logger.info(`links.length: ${links.length}`);
    }

    return links;

  } catch (error) {
    logger.error(`获取360kan综艺详情失败: ${error}`);
    return [];
  }
}

