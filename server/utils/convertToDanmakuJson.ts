import useLogger from "../composables/useLogger";
import type {
  DanmakuContents,
  DanmakuJson,
  DanmakuInputObject,
  DanmakuItem,
  DanmakuTypeMap,
  BilibiliDanmakuInput,
  DanmakuNewFormatObject
} from "#shared/types/danmuku";

const logger = useLogger();

/**
 * 转换弹幕数据为标准JSON格式
 */
export default function convertToDanmakuJson(contents: DanmakuContents, platform: string): DanmakuJson[] {
  let danmus: DanmakuJson[] = [];
  let cidCounter: number = 1;

  // 类型映射表
  const typeMap: DanmakuTypeMap = { right: 1, top: 4, bottom: 5 };

  // 十六进制转十进制函数
  const hexToDecimal: HexToDecimalFunction = (hex: string): number =>
    (hex ? parseInt(hex.replace("#", ""), 16) : 16777215);

  // 统一处理输入为数组
  let items: DanmakuInputItem[] = [];
  if (typeof contents === "string") {
    // 处理 XML 字符串
    items = [...contents.matchAll(/<d p="([^"]+)">([^<]+)<\/d>/g)].map(match => ({
      p: match[1],
      m: match[2]
    })) as BilibiliDanmakuInput[];
  } else if (contents && Array.isArray((contents as any).danmuku)) {
    // 处理 danmuku 数组，映射为对象格式
    items = (contents as any).danmuku.map((item: DanmakuItem): DanmakuInputObject => ({
      timepoint: item[0],
      ct: typeMap[item[1]] !== undefined ? typeMap[item[1]] : 1,
      color: hexToDecimal(item[2]),
      content: item[4]
    }));
  } else if (Array.isArray(contents)) {
    // 处理标准对象数组
    items = contents as DanmakuInputObject[];
  }

  if (!items.length) {
    throw new Error("无效输入，需为 XML 字符串或弹幕数组");
  }

  for (const item of items) {
    let attributes: string;
    let m: string;

    // 新增：处理新格式的弹幕数据
    if ("progress" in item && "mode" in item && "content" in item) {
      // 处理新格式的弹幕对象
      const newFormatItem = item as DanmakuNewFormatObject;
      attributes = [
        (newFormatItem.progress / 1000).toFixed(2), // progress 转换为秒
        newFormatItem.mode || 1,
        newFormatItem.color || 16777215,
        `[${platform}]`
      ].join(",");
      m = newFormatItem.content;
    } else if ("timepoint" in item) {
      // 处理对象数组输入
      const objItem = item as DanmakuInputObject;
      attributes = [
        parseFloat(objItem.timepoint.toString()).toFixed(2),
        objItem.ct || 0,
        objItem.color || 16777215,
        `[${platform}]`
      ].join(",");
      m = objItem.content;
    } else {
      if (!("p" in item)) {
        continue;
      }
      // 处理 XML 解析后的格式
      const xmlItem = item as BilibiliDanmakuInput;
      const pValues = xmlItem.p.split(",");
      attributes = [
        parseFloat(pValues[0]).toFixed(2),
        pValues[1] || 0,
        pValues[3] || 16777215,
        `[${platform}]`
      ].join(",");
      m = xmlItem.m;
    }

    danmus.push({ p: attributes, m, cid: cidCounter++ });
  }

  logger.info("danmus:", danmus.length);
  // 输出前五条弹幕
  logger.info("Top 5 danmus:", JSON.stringify(danmus.slice(0, 5), null, 2));
  return danmus;
}