/**
 * Bilibili 弹幕模块测试
 */

import { fetchBilibili } from './bilibili';

// 测试用例
const testUrls = [
  'https://www.bilibili.com/video/BV1xx411c7XD', // 普通视频
  'https://www.bilibili.com/video/av123456', // av号视频  
  'https://www.bilibili.com/bangumi/play/ep123456' // 番剧
];

async function testBilibiliModule() {
  console.log('Testing Bilibili module...');
  
  for (const url of testUrls) {
    try {
      console.log(`\nTesting URL: ${url}`);
      const result = await fetchBilibili(url);
      console.log(`Result: ${result.length} danmus found`);
    } catch (error) {
      console.error(`Error testing ${url}:`, error);
    }
  }
}

// 仅在直接运行时执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testBilibiliModule();
}

export { testBilibiliModule };