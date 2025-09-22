/**
 * 登录 API 端点
 * 使用 nuxt-auth-utils 进行密码验证和会话管理
 */

import { config } from '~~/server/utils/env-config';
import useLogger from '~~/server/composables/useLogger';

const logger = useLogger();

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body;

    // 验证输入
    if (!username || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Username and password are required'
      });
    }

    // 检查是否启用了密码认证
    const isPasswordAuthEnabled = await config.isPasswordAuthEnabled();
    if (!isPasswordAuthEnabled) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Password authentication is not configured'
      });
    }

    // 获取配置的用户名和密码
    const configUsername = await config.getAuthUsername();
    const configPassword = await config.getAuthPassword();

    // 验证凭据
    if (username.toString() !== configUsername.toString() || password.toString() !== configPassword.toString()) {
      logger.warn('Failed login attempt', { username });
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      });
    }

    // 创建会话
    await setUserSession(event, {
      user: {
        username: configUsername,
        loginTime: new Date().toISOString()
      }
    });

    logger.info('User logged in successfully', { username: configUsername });

    return {
      success: true,
      message: 'Login successful',
      user: {
        username: configUsername,
        loginTime: new Date().toISOString()
      }
    };

  } catch (error: any) {
    logger.error('Login failed:', error);

    // 如果是我们创建的错误，直接抛出
    if (error.statusCode) {
      throw error;
    }

    // 其他错误
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});
