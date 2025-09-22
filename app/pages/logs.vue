<template>
  <div class="flex flex-col gap-6">
    <!-- 页面描述 -->
    <Card>
      <CardContent class="pt-6">
        <div class="text-center">
          <h2 class="text-lg font-semibold mb-2">系统日志</h2>
          <p class="text-sm text-muted-foreground">
            查看系统运行日志和错误信息
          </p>
        </div>
      </CardContent>
    </Card>

    <!-- 日志查看组件 -->
    <LogsTest />
  </div>
</template>

<script setup>
import { Card, CardContent } from '@/components/ui/card'

// 设置页面标题
useHead({
  title: '系统日志 - 弹幕API管理中心',
  meta: [
    { name: 'description', content: '查看弹幕API系统的运行日志' }
  ]
})
</script>
