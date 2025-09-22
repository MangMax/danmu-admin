/**
 * 全局认证中间件
 * 检查用户是否已登录，如果未登录且启用了密码认证，则重定向到登录页面
 */

export default defineNuxtRouteMiddleware(async (to) => {
  // 跳过登录页面
  if (to.path === '/login') {
    return
  }

  try {
    // 检查配置是否启用了密码认证
    const config = await $fetch('/api/config')

    if (config.passwordAuth !== 'enabled') {
      // 未启用密码认证，直接通过
      return
    }
    const { user } = useUserSession()


    if (!user.value?.username) {
      // 未登录，重定向到登录页面
      return navigateTo('/login')
    }

  } catch (error) {
    // 获取配置或用户信息失败，重定向到登录页面
    console.error('Auth middleware error:', error)
    return navigateTo('/login')
  }
})
