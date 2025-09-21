/**
 * 首页接口
 * 提供 API 服务的基本信息和使用说明
 * 与原 danmu_v1.1.0.js 的首页逻辑保持一致
 */

import { config } from '~~/server/utils/env-config';
import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (_event) => {
  try {
    logger.info('Homepage accessed');

    const currentConfig = await config.get();
    const isTokenAuthEnabled = await config.isTokenAuthEnabled();

    const response = {
      message: "Welcome to the LogVar Danmu API server",
      version: currentConfig.version,
      repository: "https://github.com/huangxd-/danmu_api.git",
      description: "一个人人都能部署的基于 js 的弹幕 API 服务器，支持爱优腾芒哔人弹幕直接获取，兼容弹弹play的搜索、详情查询和弹幕获取接口，并提供日志记录，支持vercel/cloudflare/docker/claw等部署方式，不用提前下载弹幕，没有nas或小鸡也能一键部署。",
      notice: "本项目仅为个人爱好开发，代码开源。如有任何侵权行为，请联系本人删除。有问题提issue或私信机器人都ok。https://t.me/ddjdd_bot",

      // API 使用说明
      usage: isTokenAuthEnabled ? {
        authentication: "Token认证已启用，所有API请求需要在URL路径中包含token",
        tokenFormat: "/{token}/api/v2/...",
        tokenRequired: true,
        example: `/${currentConfig.token}/api/v2/search/anime?keyword=鬼灭之刃`
      } : {
        authentication: "Token认证未启用，可直接访问API",
        tokenFormat: "/api/v2/...",
        tokenRequired: false,
        example: "/api/v2/search/anime?keyword=鬼灭之刃",
        note: "如需启用认证，请设置环境变量 NUXT_TOKEN"
      },

      // 支持的API端点
      endpoints: isTokenAuthEnabled ? {
        search: `/${currentConfig.token}/api/v2/search/anime - 搜索动漫`,
        episodes: `/${currentConfig.token}/api/v2/search/episodes - 搜索剧集`,
        match: `/${currentConfig.token}/api/v2/match - 弹幕匹配`,
        bangumi: `/${currentConfig.token}/api/v2/bangumi/{animeId} - 获取番剧详情`,
        comment: `/${currentConfig.token}/api/v2/comment/{commentId} - 获取弹幕`,
        logs: `/${currentConfig.token}/api/logs - 查看日志`,
        config: `/${currentConfig.token}/api/config - 系统配置`
      } : {
        search: "/api/v2/search/anime - 搜索动漫",
        episodes: "/api/v2/search/episodes - 搜索剧集",
        match: "/api/v2/match - 弹幕匹配",
        bangumi: "/api/v2/bangumi/{animeId} - 获取番剧详情",
        comment: "/api/v2/comment/{commentId} - 获取弹幕",
        logs: "/api/logs - 查看日志",
        config: "/api/config - 系统配置"
      },

      // 支持的平台
      supportedPlatforms: currentConfig.allowedPlatforms,

      // 系统状态
      status: {
        runtime: currentConfig.runtime,
        environment: currentConfig.nodeEnv,
        tokenAuth: isTokenAuthEnabled ? "enabled" : "disabled",
        uptime: process.uptime ? Math.floor(process.uptime()) : 0
      },

      timestamp: new Date().toISOString()
    };

    logger.debug('Homepage response generated', {
      version: currentConfig.version,
      runtime: currentConfig.runtime
    });

    return response;
  } catch (error: any) {
    logger.error('Failed to generate homepage response:', error);

    // 即使出错也要返回基本信息
    return {
      message: "Welcome to the LogVar Danmu API server",
      version: "1.1.0",
      error: "Failed to load full configuration",
      timestamp: new Date().toISOString(),
      usage: {
        authentication: "配置加载失败，请检查服务器状态",
        note: "默认情况下无需token认证，如设置了NUXT_TOKEN环境变量则需要token"
      }
    };
  }
});