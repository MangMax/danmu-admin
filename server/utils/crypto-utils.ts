/**
 * 加密工具函数模块
 * 基于 crypto-js, ts-md5, iconv-lite 实现
 */

import { Md5 } from 'ts-md5';
import CryptoJS from 'crypto-js';
import CryptoTS from 'crypto-ts';
import iconv from 'iconv-lite';
import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

/**
 * MD5 哈希函数
 * 基于 ts-md5 实现
 */
export function md5(message: string): string {
  try {
    return Md5.hashStr(message).toString().toLowerCase();
  } catch (error) {
    logger.error('MD5 hash failed:', error);
    throw new Error('MD5 hash failed');
  }
}

/**
 * AES 加密
 * 基于 crypto-js 实现
 */
export function aesEncrypt(text: string, key: string, options?: {
  mode?: typeof CryptoTS.mode.ECB | typeof CryptoTS.mode.CBC;
  padding?: typeof CryptoTS.pad.PKCS7;
  iv?: string;
}): string {
  try {
    const {
      mode: encMode = CryptoTS.mode.ECB,
      padding = CryptoTS.pad.PKCS7,
      iv
    } = options || {};

    const keyUtf8 = CryptoTS.enc.Utf8.parse(key);
    const textUtf8 = CryptoTS.enc.Utf8.parse(text);

    const encryptOptions: any = {
      mode: encMode,
      padding: padding
    };

    // 如果是 CBC 模式且提供了 IV
    if (encMode === CryptoTS.mode.CBC && iv) {
      encryptOptions.iv = CryptoTS.enc.Utf8.parse(iv);
    }

    const encrypted = CryptoTS.AES.encrypt(textUtf8, keyUtf8, encryptOptions);
    return encrypted.toString();
  } catch (error) {
    logger.error('AES encryption failed:', error);
    throw new Error('AES encryption failed');
  }
}

/**
 * AES 解密
 */
export function aesDecrypt(cipherText: string, key: string, options?: {
  mode?: typeof CryptoTS.mode.ECB | typeof CryptoTS.mode.CBC;
  padding?: typeof CryptoTS.pad.PKCS7;
  iv?: string;
}): string {
  try {
    const {
      mode: decMode = CryptoTS.mode.ECB,
      padding = CryptoTS.pad.PKCS7,
      iv
    } = options || {};

    const keyUtf8 = CryptoTS.enc.Utf8.parse(key);

    const decryptOptions: any = {
      mode: decMode,
      padding: padding
    };

    // 如果是 CBC 模式且提供了 IV
    if (decMode === CryptoTS.mode.CBC && iv) {
      decryptOptions.iv = CryptoTS.enc.Utf8.parse(iv);
    }

    const decrypted = CryptoTS.AES.decrypt(cipherText, keyUtf8, decryptOptions);
    return decrypted.toString(CryptoTS.enc.Utf8);
  } catch (error) {
    logger.error('AES decryption failed:', error);
    throw new Error('AES decryption failed');
  }
}

/**
 * AES Base64 解密
 * 用于解密 Base64 编码的密文
 */
export function aesDecryptBase64(cipherB64: string, keyStr: string): string | null {
  try {
    const key = CryptoTS.enc.Utf8.parse(keyStr);
    const cipherParams = new CryptoTS.lib.CipherParams({
      ciphertext: CryptoJS.enc.Base64.parse(cipherB64)
    });

    const decrypted = CryptoTS.AES.decrypt(cipherParams, key, {
      mode: CryptoTS.mode.ECB,
      padding: CryptoTS.pad.PKCS7,
    });

    const text = decrypted.toString(CryptoTS.enc.Utf8);
    return text || null;
  } catch (error) {
    logger.warn('AES Base64 decryption failed:', error);
    return null;
  }
}

/**
 * HMAC-SHA256 签名
 */
export function hmacSha256(message: string, key: string): string {
  try {
    const hash = CryptoJS.HmacSHA256(message, key);
    return hash.toString(CryptoJS.enc.Base64);
  } catch (error) {
    logger.error('HMAC-SHA256 failed:', error);
    throw new Error('HMAC-SHA256 failed');
  }
}

/**
 * HMAC-SHA256 签名（兼容原版 danmu.js 的参数顺序）
 * @param key 密钥
 * @param message 消息
 * @returns Base64 格式的签名
 */
export function createHmacSha256(key: string, message: string): string {
  try {
    const hash = CryptoJS.HmacSHA256(message, key);
    return hash.toString(CryptoJS.enc.Base64);
  } catch (error) {
    logger.error('HMAC-SHA256 (legacy) failed:', error);
    throw new Error('HMAC-SHA256 (legacy) failed');
  }
}

/**
 * Base64 编码
 */
export function base64Encode(text: string): string {
  try {
    return CryptoJS.enc.Base64.stringify(CryptoTS.enc.Utf8.parse(text));
  } catch (error) {
    logger.error('Base64 encoding failed:', error);
    throw new Error('Base64 encoding failed');
  }
}

/**
 * Base64 解码
 */
export function base64Decode(base64Text: string): string {
  try {
    return CryptoJS.enc.Base64.parse(base64Text).toString(CryptoTS.enc.Utf8);
  } catch (error) {
    logger.error('Base64 decoding failed:', error);
    throw new Error('Base64 decoding failed');
  }
}

/**
 * 字符编码转换工具
 * 基于 iconv-lite 实现
 */
export class EncodingConverter {
  /**
   * UTF-8 到 Latin1 (ISO-8859-1) 转换后 Base64 编码
   * 用于优酷等平台的特殊需求
   */
  static latin1Base64(str: string): string {
    try {
      return iconv.encode(str, 'latin1').toString('base64');
    } catch (error) {
      logger.error('Latin1 Base64 encoding failed:', error);
      throw new Error('Latin1 Base64 encoding failed');
    }
  }

  /**
   * GBK 编码转换
   */
  static toGBK(str: string): Buffer {
    try {
      return iconv.encode(str, 'gbk');
    } catch (error) {
      logger.error('GBK encoding failed:', error);
      throw new Error('GBK encoding failed');
    }
  }

  /**
   * GBK 解码转换
   */
  static fromGBK(buffer: Buffer): string {
    try {
      return iconv.decode(buffer, 'gbk');
    } catch (error) {
      logger.error('GBK decoding failed:', error);
      throw new Error('GBK decoding failed');
    }
  }

  /**
   * 通用编码转换
   */
  static convert(text: string, fromEncoding: string, toEncoding: string): string {
    try {
      const buffer = iconv.encode(text, fromEncoding);
      return iconv.decode(buffer, toEncoding);
    } catch (error) {
      logger.error(`Encoding conversion failed (${fromEncoding} -> ${toEncoding}):`, error);
      throw new Error(`Encoding conversion failed (${fromEncoding} -> ${toEncoding})`);
    }
  }
}

/**
 * 数据自动解码工具
 * 尝试多种解码方式，用于处理未知格式的数据
 */
export function autoDecode(data: any, aesKey?: string): any {
  const text = typeof data === 'string' ? data.trim() : JSON.stringify(data ?? '');

  // 首先尝试 JSON 解析
  try {
    return JSON.parse(text);
  } catch {
    // JSON 解析失败，继续下一步
  }

  // 如果提供了 AES 密钥，尝试 AES 解密
  if (aesKey) {
    const decrypted = aesDecryptBase64(text, aesKey);
    if (decrypted) {
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    }
  }

  // 如果都失败了，返回原始文本
  return text;
}

/**
 * 构建查询字符串
 * 将对象转换为 URL 查询参数字符串
 */
export function buildQueryString(params: Record<string, any>): string {
  try {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  } catch (error) {
    logger.error('Query string building failed:', error);
    throw new Error('Query string building failed');
  }
}

// 导出常用的加密工具组合
export const CryptoUtils = {
  md5,
  aesEncrypt,
  aesDecrypt,
  aesDecryptBase64,
  hmacSha256,
  createHmacSha256,
  base64Encode,
  base64Decode,
  autoDecode,
  buildQueryString,
  EncodingConverter
};

export default CryptoUtils;
