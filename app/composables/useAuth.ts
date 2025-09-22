/**
 * 认证状态管理 Composable
 * 提供登录、登出、用户信息等功能
 */


export const useAuth = () => {
  const loading = ref(false)
  const error = ref('')
  const { fetch } = useUserSession()

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
        await fetch()
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
      await fetch()
      return { success: true, message: '登出成功' }
    } catch (err: any) {
      const message = err.data?.message || err.statusMessage || '登出失败'
      error.value = message
      return { success: false, message }
    } finally {
      loading.value = false
    }
  }


  return {
    loading: readonly(loading),
    error: readonly(error),

    // 方法
    login,
    logout,
  }
}
