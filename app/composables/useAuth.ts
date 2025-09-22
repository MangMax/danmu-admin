/**
 * 认证状态管理 Composable
 * 提供登录、登出、用户信息等功能
 */

import type { User } from "#auth-utils"

export const useAuth = () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref('')

  // 检查是否已登录
  const isLoggedIn = computed(() => !!user.value)

  // 获取用户信息
  const fetchUser = async () => {
    if (loading.value) return

    loading.value = true
    error.value = ''

    try {
      const response = await $fetch('/api/auth/me')
      if (response.success) {
        user.value = response.user
      } else {
        user.value = null
      }
    } catch (err: any) {
      console.error('Failed to fetch user:', err)
      user.value = null
      error.value = err.data?.message || '获取用户信息失败'
    } finally {
      loading.value = false
    }
  }

  // 登录
  const login = async (username: string, password: string) => {
    if (loading.value) return { success: false, message: '正在登录中...' }

    loading.value = true
    error.value = ''

    try {
      const response = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })

      if (response.success) {
        user.value = response.user
        return { success: true, message: '登录成功' }
      } else {
        error.value = response.message || '登录失败'
        return { success: false, message: error.value }
      }
    } catch (err: any) {
      const message = err.data?.message || err.statusMessage || '登录失败'
      error.value = message
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    if (loading.value) return { success: false, message: '正在登出中...' }

    loading.value = true
    error.value = ''

    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })

      user.value = null
      return { success: true, message: '登出成功' }
    } catch (err: any) {
      const message = err.data?.message || err.statusMessage || '登出失败'
      error.value = message
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }

  // 检查认证状态
  const checkAuth = async () => {
    await fetchUser()
    return isLoggedIn.value
  }

  return {
    // 状态
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    isLoggedIn,

    // 方法
    fetchUser,
    login,
    logout,
    checkAuth
  }
}
