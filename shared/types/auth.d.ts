/**
 * 认证相关类型定义
 */

export interface AuthUser {
  username: string;
  loginTime: string;
}

export interface AuthSession {
  user: AuthUser;
}

// 扩展 nuxt-auth-utils 的类型
declare module '#auth-utils' {
  interface User extends AuthUser { }
  interface Session extends AuthSession { }
}