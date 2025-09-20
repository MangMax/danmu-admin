<template>
  <Card class="config-info">
    <CardHeader>
      <CardTitle class="text-2xl">系统配置信息</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="pending" class="text-center py-8">
        <div class="inline-flex items-center">
          <div class="i-lucide-refresh-cw animate-spin h-6 w-6 mr-2 text-muted-foreground" />
          <p class="text-muted-foreground">加载配置信息...</p>
        </div>
      </div>

      <div v-else-if="error" class="rounded-md bg-destructive/15 border border-destructive/20 p-4">
        <div class="flex items-center">
          <div class="i-lucide-alert-circle h-5 w-5 text-destructive mr-2" />
          <span class="font-medium text-destructive">错误:</span>
          <span class="ml-1 text-destructive">无法加载配置信息</span>
        </div>
      </div>

      <div v-else-if="data" class="flex flex-col gap-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 基本信息 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-lg flex items-center">
                <div class="i-lucide-info h-5 w-5 mr-2 text-blue-600" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">版本:</span>
                <Badge variant="outline" class="font-mono">{{ data.version }}</Badge>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">运行时:</span>
                <Badge variant="outline" class="font-mono">{{ data.runtime }}</Badge>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">环境:</span>
                <Badge :variant="getEnvVariant(data.nodeEnv)" class="font-mono">{{ data.nodeEnv }}</Badge>
              </div>
            </CardContent>
          </Card>

          <!-- 配置状态 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-lg flex items-center">
                <div class="i-lucide-settings h-5 w-5 mr-2 text-green-600" />
                配置状态
              </CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">Token认证:</span>
                <Badge variant="secondary" class="text-orange-600">
                  {{ data.tokenAuth || '已禁用' }}
                </Badge>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">自定义弹幕服务器:</span>
                <Badge :variant="data.hasCustomOtherServer ? 'default' : 'secondary'">
                  {{ data.hasCustomOtherServer ? '是' : '否' }}
                </Badge>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">自定义VOD服务器:</span>
                <Badge :variant="data.hasCustomVodServer ? 'default' : 'secondary'">
                  {{ data.hasCustomVodServer ? '是' : '否' }}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <!-- 性能配置 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-lg flex items-center">
                <div class="i-lucide-gauge h-5 w-5 mr-2 text-purple-600" />
                性能配置
              </CardTitle>
            </CardHeader>
            <CardContent class="flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">请求超时:</span>
                <Badge variant="outline" class="font-mono">{{ data.requestTimeout }}ms</Badge>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">最大重试:</span>
                <Badge variant="outline" class="font-mono">{{ data.maxRetryCount }}次</Badge>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">最大日志:</span>
                <Badge variant="outline" class="font-mono">{{ data.maxLogs }}条</Badge>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-muted-foreground">最大缓存:</span>
                <Badge variant="outline" class="font-mono">{{ data.maxAnimes }}个</Badge>
              </div>
            </CardContent>
          </Card>

          <!-- 支持的平台 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-lg flex items-center">
                <div class="i-lucide-globe h-5 w-5 mr-2 text-indigo-600" />
                支持的平台
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="platform in data.allowedPlatforms" :key="platform" variant="secondary">
                  {{ platform }}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div class="text-center">
          <Button @click="refresh()" variant="outline" :disabled="pending">
            <div v-if="pending" class="i-lucide-refresh-cw h-4 w-4 mr-2 animate-spin" />
            <div v-else class="i-lucide-refresh-cw h-4 w-4 mr-2" />
            {{ pending ? '刷新中...' : '刷新配置' }}
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

// 获取配置信息
const { data, pending, error, refresh } = await useFetch('/api/config');

// 环境Badge变体
const getEnvVariant = (env: string) => {
  switch (env) {
    case 'production':
      return 'default'; // 绿色
    case 'development':
      return 'secondary'; // 蓝色
    case 'test':
      return 'outline'; // 黄色边框
    default:
      return 'secondary';
  }
};
</script>

<style scoped>
.config-info {
  max-width: none;
}
</style>
