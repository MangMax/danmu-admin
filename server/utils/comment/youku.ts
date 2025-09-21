import { httpGet, httpPost } from '../request-client';
import useLogger from "../../composables/useLogger";
import convertToDanmakuJson from '../convertToDanmakuJson';
import { CryptoUtils } from '../crypto-utils';
import { utils } from '../string-utils';
import { config } from '../env-config';
import type { DanmakuInputObject, DanmakuJson } from '#shared/types/danmuku';

const logger = useLogger();

export async function fetchYouku(inputUrl: string): Promise<DanmakuJson[]> {
  logger.log('开始从本地请求优酷弹幕...', inputUrl);
  if (!inputUrl) return [];

  const api_video_info = 'https://openapi.youku.com/v2/videos/show.json';
  const api_danmaku = 'https://acs.youku.com/h5/mopen.youku.danmu.list/1.0/';

  // 使用工具类验证和解析URL
  if (!utils.url.isValidUrl(inputUrl)) {
    logger.error('Invalid URL format:', inputUrl);
    return [];
  }

  // 提取 video_id
  const regex = /^(https?:\/\/[^/]+)(\/[^?#]*)/;
  const match = inputUrl.match(regex);
  let path: string[] | undefined;
  if (match) {
    path = match[2].split('/').filter(Boolean);
    path.unshift('');
    logger.log('URL path:', path);
  } else {
    logger.error('Failed to parse URL path');
    return [];
  }

  const video_id = path[path.length - 1].split('.')[0].slice(3);
  logger.log('video_id:', video_id);

  // 获取页面标题和视频时长
  let res: any;
  try {
    const videoInfoUrl = `${api_video_info}?client_id=53e6cc67237fc59a&video_id=${video_id}&package=com.huawei.hwvplayer.youku&ext=show`;
    res = await httpGet(videoInfoUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
      },
      allow_redirects: false,
    });
  } catch (error) {
    logger.error('请求视频信息失败:', error);
    return [];
  }

  const data = utils.string.safeJsonParse(res.data, res.data);
  const title = data.title;
  const duration = data.duration;
  logger.log('标题:', title, '时长:', duration);

  // 获取 cna 和 tk_enc
  let cna: string | undefined;
  let _m_h5_tk_enc: string | undefined;
  let _m_h5_tk: string | undefined;
  try {
    const cnaUrl = 'https://log.mmstat.com/eg.js';
    const tkEncUrl = 'https://acs.youku.com/h5/mtop.com.youku.aplatform.weakget/1.0/?jsv=2.5.1&appKey=24679788';
    const cnaRes = await httpGet(cnaUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
      },
      allow_redirects: false,
    });
    const etag = cnaRes.headers['etag'] || cnaRes.headers['Etag'];
    cna = etag?.replace(/^"|"$/g, '');
    let tkEncRes: any;
    while (!tkEncRes) {
      tkEncRes = await httpGet(tkEncUrl, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
        },
        allow_redirects: false,
      });
    }
    const tkEncSetCookie = tkEncRes.headers['set-cookie'] || tkEncRes.headers['Set-Cookie'];
    const tkEncMatch = tkEncSetCookie?.match(/_m_h5_tk_enc=([^;]+)/);
    _m_h5_tk_enc = tkEncMatch ? tkEncMatch[1] : undefined;
    const tkH5Match = tkEncSetCookie?.match(/_m_h5_tk=([^;]+)/);
    _m_h5_tk = tkH5Match ? tkH5Match[1] : undefined;
  } catch (error) {
    logger.error('获取 cna 或 tk_enc 失败:', error);
    return [];
  }

  const step = 60;
  const max_mat = Math.floor(duration / step) + 1;
  let contents: DanmakuInputObject[] = [];

  // 获取优酷并发配置
  const youkuConcurrency = await config.getYoukuConcurrency();
  logger.log(`优酷并发数配置: ${youkuConcurrency}`);


  // 将构造请求和解析逻辑封装为函数，返回该分段的弹幕数组
  const requestOneMat = async (mat: number): Promise<DanmakuInputObject[]> => {
    const msg: any = {
      ctime: Date.now(),
      ctype: 10004,
      cver: 'v1.0',
      guid: cna,
      mat: mat,
      mcount: 1,
      pid: 0,
      sver: '3.1.0',
      type: 1,
      vid: video_id,
    };

    const str = JSON.stringify(msg);
    function utf8ToLatin1(str: string) {
      let result = '';
      for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode > 255) {
          result += encodeURIComponent(str[i]);
        } else {
          result += str[i];
        }
      }
      return result;
    }

    function base64Encode(input: string) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let output = '';
      let buffer = 0;
      let bufferLength = 0;
      for (let i = 0; i < input.length; i++) {
        buffer = (buffer << 8) | input.charCodeAt(i);
        bufferLength += 8;
        while (bufferLength >= 6) {
          output += chars[(buffer >> (bufferLength - 6)) & 0x3F];
          bufferLength -= 6;
        }
      }
      if (bufferLength > 0) {
        output += chars[(buffer << (6 - bufferLength)) & 0x3F];
      }
      while (output.length % 4 !== 0) {
        output += '=';
      }
      return output;
    }
    const msg_b64encode = base64Encode(utf8ToLatin1(str));
    msg.msg = msg_b64encode;
    msg.sign = CryptoUtils.md5(`${msg_b64encode}MkmC9SoIw6xCkSKHhJ7b5D2r51kBiREr`).toString().toLowerCase();

    const data = JSON.stringify(msg);
    const t = Date.now();
    const params: Record<string, any> = {
      jsv: '2.5.6',
      appKey: '24679788',
      t: t,
      sign: CryptoUtils.md5([_m_h5_tk!.slice(0, 32), t, '24679788', data].join('&')).toString().toLowerCase(),
      api: 'mopen.youku.danmu.list',
      v: '1.0',
      type: 'originaljson',
      dataType: 'jsonp',
      timeout: '20000',
      jsonpIncPrefix: 'utility',
    };

    const queryString = CryptoUtils.buildQueryString(params);
    const url = `${api_danmaku}?${queryString}`;
    logger.log('piece_url: ', url);

    const results: DanmakuInputObject[] = [];
    try {
      const response = await httpPost(url, `data=${encodeURIComponent(data)}`, {
        headers: {
          Cookie: `_m_h5_tk=${_m_h5_tk};_m_h5_tk_enc=${_m_h5_tk_enc};`,
          Referer: 'https://v.youku.com',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
        },
        allow_redirects: false,
      });
      if (response.data?.data && response.data.data.result) {
        const result = JSON.parse(response.data.data.result);
        logger.log('result: ', result);

        if (result.code !== '-1') {
          const danmus = result.data.result;
          for (const danmu of danmus) {
            // 仅填入共享类型 `DanmakuInputObject` 中定义的字段
            const content: DanmakuInputObject = {
              timepoint: danmu.playat / 1000,
              ct: 1,
              size: 25,
              color: 16777215,
              unixtime: Math.floor(Date.now() / 1000),
              uid: 0,
              content: "",
            };
            if (danmu.propertis?.color) {
              try {
                content.color = JSON.parse(danmu.propertis).color;
                if (danmu.propertis?.pos) {
                  const pos = JSON.parse(danmu.propertis).pos;
                  if (pos === 1) {
                    content.ct = 5;
                  } else if (pos === 2) {
                    content.ct = 4;
                  }
                }
              } catch {
                // ignore parse error
              }
            }
            results.push(content);
          }
        }
      }
    } catch (error: any) {
      logger.error(`优酷分段请求失败 (mat=${mat}):`, error?.message || error);
    }
    return results;
  };

  // 并发限制处理，批量执行请求
  const mats = Array.from({ length: max_mat }, (_, i) => i);
  for (let i = 0; i < mats.length; i += youkuConcurrency) {
    const batch = mats.slice(i, i + youkuConcurrency).map((m) => requestOneMat(m));
    try {
      const settled = await Promise.allSettled(batch);
      for (const s of settled) {
        if (s.status === 'fulfilled' && Array.isArray(s.value)) {
          contents = contents.concat(s.value);
        }
      }
    } catch (e) {
      logger.error('优酷分段批量请求失败:', e);
    }
  }

  logger.log('contents:', contents);
  return convertToDanmakuJson(contents, 'youku');
}
