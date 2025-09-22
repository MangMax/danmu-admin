<template>
  <div class="min-h-screen bg-background">
    <!-- 头部 -->
    <header class="bg-card shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-foreground">弹幕API测试中心</h1>
            <p class="text-sm text-muted-foreground mt-1">测试所有弹幕API端点的功能</p>
          </div>
          <div class="flex items-center gap-4">
            <Badge variant="secondary" class="text-sm">Danmu Admin v2.0</Badge>
            <!-- 认证状态显示 -->
            <div v-if="isLoggedIn" class="flex items-center gap-2">
              <Badge variant="outline" class="text-sm">
                欢迎，{{ user?.username }}
              </Badge>
              <Button variant="outline" size="sm" @click="handleLogout" :disabled="loading">
                {{ loading ? '登出中...' : '登出' }}
              </Button>
            </div>
            <div v-else-if="passwordAuthEnabled" class="flex items-center gap-2">
              <Button variant="default" size="sm" @click="navigateToLogin">
                登录
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- 配置信息 -->
      <div class="mb-8">
        <ConfigInfo />
      </div>

      <!-- API概览 -->
      <div class="mb-8">
        <ApiOverview />
      </div>

      <!-- 缓存统计 -->
      <Card class="mb-8">
        <CardHeader>
          <CardTitle>缓存统计</CardTitle>
        </CardHeader>
        <CardContent>
          <CacheStats />
        </CardContent>
      </Card>

      <!-- 缓存数据详情 -->
      <div class="mb-8">
        <CacheDetails />
      </div>

      <!-- API测试组件网格 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 搜索动漫 -->
        <SearchAnimeTest />

        <!-- 搜索集数 -->
        <SearchEpisodesTest />

        <!-- 匹配动漫 -->
        <MatchAnimeTest />

        <!-- 番剧详情 -->
        <BangumiDetailTest />

        <!-- 弹幕获取 -->
        <CommentTest />

        <!-- 日志查看 -->
        <LogsTest />
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="bg-white border-t mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="text-center text-sm text-gray-500">
          <p>弹幕API服务器 - 支持多平台弹幕获取</p>
          <p class="mt-1">
            <a href="https://github.com/huangxd-/danmu_api.git" target="_blank"
              class="text-blue-600 hover:text-blue-800">
              GitHub Repository
            </a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// 认证状态
const { user, isLoggedIn, loading, logout, checkAuth } = useAuth()

// 配置状态
const config = ref(null)
const passwordAuthEnabled = ref(false)

// 检查认证状态
onMounted(async () => {
  await checkAuth()
  await fetchConfig()
})

// 获取配置信息
const fetchConfig = async () => {
  try {
    const response = await $fetch('/api/config')
    config.value = response
    passwordAuthEnabled.value = response.passwordAuth === 'enabled'
  } catch (error) {
    console.error('Failed to fetch config:', error)
  }
}

// 处理登出
const handleLogout = async () => {
  const result = await logout()
  if (result.success) {
    await navigateTo('/login')
  }
}

// 导航到登录页面
const navigateToLogin = () => {
  navigateTo('/login')
}

// 设置页面标题
useHead({
  title: '弹幕API测试中心',
  meta: [
    { name: 'description', content: '测试弹幕API的所有端点功能' }
  ]
})
</script>
