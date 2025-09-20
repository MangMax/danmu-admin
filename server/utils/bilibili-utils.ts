/**
 * Bilibili 弹幕解析工具函数
 */

// Base64 解码函数
function base64ToBytes(b64: string): Uint8Array {
  // 先把 Base64 字符串转换成普通字符
  const binaryString = atob(b64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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
  let str = "";
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    if (b1 < 0x80) {
      str += String.fromCharCode(b1);
    } else if (b1 >= 0xc0 && b1 < 0xe0) {
      const b2 = bytes[i++];
      str += String.fromCharCode(((b1 & 0x1f) << 6) | (b2 & 0x3f));
    } else if (b1 >= 0xe0 && b1 < 0xf0) {
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      str += String.fromCharCode(((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f));
    } else if (b1 >= 0xf0) {
      // surrogate pair
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      const b4 = bytes[i++];
      const codepoint = ((b1 & 0x07) << 18) |
        ((b2 & 0x3f) << 12) |
        ((b3 & 0x3f) << 6) |
        (b4 & 0x3f);
      const cp = codepoint - 0x10000;
      str += String.fromCharCode(0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF));
    }
  }
  return str;
}

// 解析 Bilibili Base64 弹幕数据
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

    let innerOffset = 0;
    const elem: any = {};

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

    elems.push(elem);
  }

  return elems;
}
