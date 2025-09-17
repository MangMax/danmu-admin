import { httpGet } from '../request-client';
import useLogger from '../../composables/useLogger';
import type { DanmakuJson } from '../../../shared/types/danmuku';
import { AES, enc, lib, mode, pad } from 'crypto-js';

// We'll use crypto-js to perform AES-128-ECB decryption and base64 handling

const logger = useLogger();

// --- helper functions (sha256/hmac etc) ---
// simplified: use static-dm endpoint directly to fetch danmu JSON

function parseRRSPPFields(pField: string) {
  const parts = String(pField).split(',');
  const num = (i: number, cast: (x: any) => any, dft: any) => { try { return cast(parts[i]); } catch { return dft; } };
  const timestamp = num(0, parseFloat, 0);
  const mode = num(1, x => parseInt(x, 10), 1);
  const size = num(2, x => parseInt(x, 10), 25);
  const color = num(3, x => parseInt(x, 10), 16777215);
  const userId = parts[6] || '';
  const contentId = parts[7] || `${timestamp}:${userId}`;
  return { timestamp, mode, size, color, userId, contentId };
}

function formatComments(items: any[]) {
  const unique: Record<string, any> = {};
  for (const it of items) {
    const text = String(it.d || '');
    const meta = parseRRSPPFields(it.p);
    if (!unique[meta.contentId]) unique[meta.contentId] = { content: text, ...meta };
  }
  const grouped: Record<string, any[]> = {};
  for (const c of Object.values(unique)) {
    if (!grouped[c.content]) grouped[c.content] = [];
    grouped[c.content].push(c);
  }
  const processed: any[] = [];
  for (const [_content, group] of Object.entries(grouped)) {
    if (group.length === 1) processed.push(group[0]);
    else {
      const first = group.reduce((a: any, b: any) => a.timestamp < b.timestamp ? a : b);
      processed.push({ ...first, content: `${first.content} X${group.length}` });
    }
  }
  return processed.map((c: any) => ({
    cid: Number(c.contentId),
    p: `${c.timestamp.toFixed(2)},${c.mode},${c.color},[renren]`,
    m: c.content,
    t: c.timestamp
  }));
}

async function fetchEpisodeDanmu(sid: string) {
  const ClientProfile = { user_agent: 'Mozilla/5.0', origin: 'https://rrsp.com.cn', referer: 'https://rrsp.com.cn/' };
  const url = `https://static-dm.rrmj.plus/v1/produce/danmu/EPISODE/${sid}`;
  const headers = { Accept: 'application/json', 'User-Agent': ClientProfile.user_agent, Origin: ClientProfile.origin, Referer: ClientProfile.referer };
  const resp = await renrenHttpGet(url, { headers });
  if (!resp?.data) return null;
  const data = autoDecode(resp.data);
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  return null;
}

// 简单实现：对 renren 的 GET 包装器（保留原始实现风格）
async function renrenHttpGet(url: string, { params = {}, headers = {} } = {}) {
  // 如果有 params，可将其拼接到 url，这里实现最小功能以匹配原逻辑
  let u = url;
  const keys = Object.keys(params || {});
  if (keys.length) {
    const qs = keys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String((params as any)[k] ?? ''))}`).join('&');
    u = url + (url.includes('?') ? '&' : '?') + qs;
  }
  const resp = await httpGet(u, { headers });
  return resp;
}

function aesDecryptBase64(cipherB64: string, keyStr: string) {
  try {
    const key = enc.Utf8.parse(keyStr);

    const cipherParams = lib.CipherParams.create({ ciphertext: enc.Base64.parse(cipherB64) });

    const decrypted = AES.decrypt(cipherParams, key, {
      mode: mode.ECB,
      padding: pad.Pkcs7,
    });

    const text = decrypted.toString(enc.Utf8);
    return text || null;
  } catch (e) {
    logger.warn('aesDecryptBase64 failed', e);
    return null;
  }
}

function autoDecode(anything: any) {
  const text = typeof anything === 'string' ? anything.trim() : JSON.stringify(anything ?? '');
  try {
    return JSON.parse(text);
  } catch { }

  const AES_KEY = '3b744389882a4067';
  const dec = aesDecryptBase64(text, AES_KEY);
  if (dec != null) {
    try {
      return JSON.parse(dec);
    } catch {
      return dec;
    }
  }

  return text;
}

export async function fetchRenren(episodeId: string): Promise<DanmakuJson[]> {
  logger.info('开始获取人人弹幕', episodeId);
  const raw = await fetchEpisodeDanmu(episodeId);
  if (!raw) return [];
  const formatted = formatComments(raw);
  logger.info('弹幕处理完成，共', formatted.length, '条');
  // formatComments 已经返回 {cid,p,m,t}，与 DanmakuJson 匹配 p/m/cid
  return formatted.map(f => ({ p: f.p, m: f.m, cid: Number(f.cid) }));
}
