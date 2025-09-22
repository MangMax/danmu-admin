<template>
  <div class="flex flex-col gap-6">
    <!-- 配置信息 -->
    <ConfigInfo />

    <!-- API概览 -->
    <ApiOverview />

    <!-- 缓存统计 -->
    <Card>
      <CardHeader>
        <CardTitle>缓存统计</CardTitle>
      </CardHeader>
      <CardContent>
        <CacheStats />
      </CardContent>
    </Card>

    <!-- 缓存数据详情 -->
    <CacheDetails />

    <!-- 页脚信息 -->
    <Card>
      <CardContent class="pt-6">
        <div class="text-center text-sm text-muted-foreground">
          <p>弹幕API服务器 - 支持多平台弹幕获取</p>
          <p class="mt-1">
            <a href="https://github.com/huangxd-/danmu_api.git" target="_blank" class="text-primary hover:underline">
              GitHub Repository
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// 设置页面标题
useHead({
  title: '系统概览 - 弹幕API管理中心',
  meta: [
    { name: 'description', content: '弹幕API系统概览和配置信息' }
  ]
})
</script>
