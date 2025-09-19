/**
 * 匹配相关工具函数
 * 提供动画匹配、季度匹配等功能
 */

/**
 * 转换中文数字为阿拉伯数字（基于原始 danmu.js）
 */
function convertChineseNumber(chineseNumber: string): number {
  // 如果是阿拉伯数字，直接转换
  if (/^\d+$/.test(chineseNumber)) {
    return Number(chineseNumber);
  }

  // 中文数字映射（简体+繁体）
  const digits: Record<string, number> = {
    // 简体
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9,
    // 繁体
    '壹': 1, '貳': 2, '參': 3, '肆': 4, '伍': 5,
    '陸': 6, '柒': 7, '捌': 8, '玖': 9
  };

  // 单位映射（简体+繁体）
  const units: Record<string, number> = {
    // 简体
    '十': 10, '百': 100, '千': 1000,
    // 繁体
    '拾': 10, '佰': 100, '仟': 1000
  };

  let result = 0;
  let current = 0;
  let lastUnit = 1;

  for (let i = 0; i < chineseNumber.length; i++) {
    const char = chineseNumber[i];

    if (digits[char] !== undefined) {
      // 数字
      current = digits[char];
    } else if (units[char] !== undefined) {
      // 单位
      const unit = units[char];

      if (current === 0) current = 1;

      if (unit >= lastUnit) {
        // 更大的单位，重置结果
        result = current * unit;
      } else {
        // 更小的单位，累加到结果
        result += current * unit;
      }

      lastUnit = unit;
      current = 0;
    }
  }

  // 处理最后的个位数
  if (current > 0) {
    result += current;
  }

  return result;
}

/**
 * 匹配动画季度信息（基于原始 danmu.js 的 matchSeason 逻辑）
 * 用于在匹配动画时判断季度是否匹配
 */
export function matchAnimeSeason(anime: AnimeSearchResult, queryTitle: string, season?: number): boolean {
  if (!season) return true;

  if (anime.animeTitle.includes(queryTitle)) {
    const title = anime.animeTitle.split("(")[0].trim();
    if (title.startsWith(queryTitle)) {
      const afterTitle = title.substring(queryTitle.length).trim();
      if (afterTitle === '' && season === 1) {
        return true;
      }
      // match number from afterTitle
      const seasonIndex = afterTitle.match(/\d+/);
      if (seasonIndex && seasonIndex[0] === season.toString()) {
        return true;
      }
      // match chinese number
      const chineseNumber = afterTitle.match(/[一二三四五六七八九十壹贰叁肆伍陆柒捌玖拾]+/);
      if (chineseNumber && convertChineseNumber(chineseNumber[0]) === season) {
        return true;
      }
    }
    return false;
  } else {
    return false;
  }
}

/**
 * 解析文件名中的季度和集数信息
 * 支持格式：Title S01E01, Title 第1季第1集 等
 */
export function parseFileName(fileName: string): {
  title: string;
  season: number | null;
  episode: number | null;
} {
  // 匹配 S01E01 格式
  const regex = /^(.+?)\s+S(\d+)E(\d+)$/;
  const match = fileName.match(regex);

  if (match) {
    return {
      title: match[1],
      season: parseInt(match[2]),
      episode: parseInt(match[3])
    };
  }

  // 匹配中文格式：标题 第1季第1集
  const chineseRegex = /^(.+?)\s+第(\d+)季第(\d+)集$/;
  const chineseMatch = fileName.match(chineseRegex);

  if (chineseMatch) {
    return {
      title: chineseMatch[1],
      season: parseInt(chineseMatch[2]),
      episode: parseInt(chineseMatch[3])
    };
  }

  // 如果没有匹配到季度信息，返回原始标题
  return {
    title: fileName,
    season: null,
    episode: null
  };
}
