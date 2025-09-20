/**
 * Bilibili 弹幕解析工具函数
 */
import CryptoJS from 'crypto-js';

// Base64 解码函数
function base64ToBytes(b64: string): Uint8Array {
  const words = CryptoJS.enc.Base64.parse(b64);
  const byteArray = new Uint8Array(words.sigBytes);
  for (let i = 0; i < words.sigBytes; i++) {
    byteArray[i] = (words.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  return byteArray;
}

// 读取变长整数
function readVarint(bytes: Uint8Array, offset: number): [number, number] {
  let result = 0n;
  let shift = 0n;
  let pos = offset;
  while (true) {
    const b = bytes[pos++];
    result |= BigInt(b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7n;
  }
  return [Number(result), pos];
}

// 读取长度分隔的数据
function readLengthDelimited(bytes: Uint8Array, offset: number): [Uint8Array, number] {
  const [length, newOffset] = readVarint(bytes, offset);
  const start = newOffset;
  const end = start + length;
  const slice = bytes.slice(start, end);
  return [slice, end];
}

// UTF-8 字节转字符串
function utf8BytesToString(bytes: Uint8Array): string {
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

// 解析 Bilibili Base64 弹幕数据 - 与 danmu_v1.0.4.1.js 保持一致
export function parseDanmakuBase64(base64: string): any[] {
  const bytes = base64ToBytes(base64);
  const elems: any[] = [];


  let offset = 0;
  while (offset < bytes.length) {
    // 每个 DanmakuElem 在 elems 列表里是 length-delimited
    const key = bytes[offset++];

    if (key !== 0x0a) break; // field=1 (elems), wire=2
    const [msgBytes, nextOffset] = readLengthDelimited(bytes, offset);
    offset = nextOffset;

    const elem = parseDanmakuElement(msgBytes);
    if (elem && Object.keys(elem).length > 0) {
      elems.push(elem);
    }
  }

  return elems;
}


// 解析单个弹幕元素
function parseDanmakuElement(msgBytes: Uint8Array): any {
  const elem: any = {};
  let innerOffset = 0;

  while (innerOffset < msgBytes.length) {
    const tag = msgBytes[innerOffset++];
    const fieldNumber = tag >> 3;
    const wireType = tag & 0x07;

    if (wireType === 0) {
      // varint
      const [val, innerNext] = readVarint(msgBytes, innerOffset);
      innerOffset = innerNext;
      switch (fieldNumber) {
        case 1: elem.id = val; break;
        case 2: elem.progress = val; break;
        case 3: elem.mode = val; break;
        case 4: elem.fontsize = val; break;
        case 5: elem.color = val; break;
        case 8: elem.ctime = val; break;
        case 9: elem.weight = val; break;
        case 11: elem.pool = val; break;
        case 13: elem.attr = val; break;
        case 15: elem.like_num = val; break;
        case 17: elem.dm_type_v2 = val; break;
      }
    } else if (wireType === 2) {
      // length-delimited
      const [valBytes, innerNext] = readLengthDelimited(msgBytes, innerOffset);
      innerOffset = innerNext;
      switch (fieldNumber) {
        case 6: elem.midHash = utf8BytesToString(valBytes); break;
        case 7: elem.content = utf8BytesToString(valBytes); break;
        case 10: elem.action = utf8BytesToString(valBytes); break;
        case 12: elem.idStr = utf8BytesToString(valBytes); break;
        case 14: elem.animation = utf8BytesToString(valBytes); break;
        case 16: elem.color_v2 = utf8BytesToString(valBytes); break;
      }
    } else {
      // 其他类型不常用，忽略
      const [_, innerNext] = readVarint(msgBytes, innerOffset);
      innerOffset = innerNext;
    }
  }

  return elem;
}
