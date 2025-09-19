<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 头部 -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">弹幕API测试中心</h1>
            <p class="text-sm text-gray-600 mt-1">测试所有弹幕API端点的功能</p>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">Danmu Admin v2.0</span>
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
      <div class="mb-8">
        <div class="bg-white rounded-lg shadow-sm border p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">缓存统计</h2>
          <CacheStats />
        </div>
      </div>

      <!-- 缓存数据详情 -->
      <div class="mb-8">
        <CacheDetails />
      </div>

      <!-- API测试组件网格 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- 搜索动漫 -->
        <div class="bg-white rounded-lg shadow-sm border">
          <SearchAnimeTest />
        </div>

        <!-- 搜索集数 -->
        <div class="bg-white rounded-lg shadow-sm border">
          <SearchEpisodesTest />
        </div>

        <!-- 匹配动漫 -->
        <div class="bg-white rounded-lg shadow-sm border">
          <MatchAnimeTest />
        </div>

        <!-- 番剧详情 -->
        <div class="bg-white rounded-lg shadow-sm border">
          <BangumiDetailTest />
        </div>

        <!-- 弹幕获取 -->
        <div class="bg-white rounded-lg shadow-sm border">
          <CommentTest />
        </div>

        <!-- 日志查看 -->
        <div class="bg-white rounded-lg shadow-sm border">
          <LogsTest />
        </div>
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
// 设置页面标题
useHead({
  title: '弹幕API测试中心',
  meta: [
    { name: 'description', content: '测试弹幕API的所有端点功能' }
  ]
})
</script>
