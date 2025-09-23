<template>
  <div class="flex flex-col gap-6">
    <!-- 页面描述 -->
    <Card>
      <CardContent class="pt-6">
        <div class="text-center">
          <h2 class="text-lg font-semibold mb-2">API接口测试</h2>
          <p class="text-sm text-muted-foreground">
            测试所有弹幕API端点的功能，包括搜索、匹配和弹幕获取
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- API测试组件网格 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    </div>
  </div>
</template>

<script setup>
// 设置页面标题
useHead({
  title: '接口测试 - 弹幕API管理中心',
  meta: [
    { name: 'description', content: '测试弹幕API的所有端点功能' }
  ]
})
</script>
