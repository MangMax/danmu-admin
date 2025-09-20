<template>
  <div class="cache-stats">
    <div v-if="pending" class="text-center py-8">
      <div class="inline-flex items-center">
        <div class="i-lucide-refresh-cw animate-spin h-5 w-5 mr-2 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">加载缓存统计...</p>
      </div>
    </div>

    <div v-else-if="error" class="rounded-md bg-destructive/15 border border-destructive/20 p-3">
      <div class="flex items-center">
        <div class="i-lucide-alert-circle h-4 w-4 text-destructive mr-2" />
        <span class="text-sm text-destructive">缓存统计加载失败</span>
      </div>
    </div>

    <div v-else-if="data" class="flex flex-col gap-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 动画缓存 -->
        <Card class="text-center">
          <CardContent class="p-6">
            <div class="flex flex-col gap-2">
              <div class="i-lucide-database h-8 w-8 text-blue-600 mx-auto" />
              <div class="text-3xl font-bold text-blue-600">{{ data.data.animes.totalAnimes }}</div>
              <div class="text-sm font-medium text-foreground">动画缓存</div>
              <Badge variant="secondary" class="text-xs">
                {{ data.data.animes.usagePercentage }}% 已使用
              </Badge>
            </div>
          </CardContent>
        </Card>

        <!-- 剧集缓存 -->
        <Card class="text-center">
          <CardContent class="p-6">
            <div class="flex flex-col gap-2">
              <div class="i-lucide-film h-8 w-8 text-green-600 mx-auto" />
              <div class="text-3xl font-bold text-green-600">{{ data.data.episodes.totalEpisodes }}</div>
              <div class="text-sm font-medium text-foreground">剧集缓存</div>
              <Badge variant="secondary" class="text-xs">
                {{ data.data.episodes.usagePercentage }}% 已使用
              </Badge>
            </div>
          </CardContent>
        </Card>

        <!-- 总缓存项 -->
        <Card class="text-center">
          <CardContent class="p-6">
            <div class="flex flex-col gap-2">
              <div class="i-lucide-hard-drive h-8 w-8 text-purple-600 mx-auto" />
              <div class="text-3xl font-bold text-purple-600">{{ data.data.totalItems }}</div>
              <div class="text-sm font-medium text-foreground">总缓存项</div>
              <Button @click="clearCache" variant="destructive" size="sm" :disabled="clearing" class="text-xs mt-2">
                <div v-if="!clearing" class="i-lucide-trash-2 h-3 w-3 mr-1" />
                <div v-else class="i-lucide-refresh-cw h-3 w-3 mr-1 animate-spin" />
                {{ clearing ? '清理中...' : '清空缓存' }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="text-center">
        <Button @click="refresh()" variant="outline" :disabled="pending">
          <div v-if="pending" class="i-lucide-refresh-cw h-4 w-4 mr-2 animate-spin" />
          <div v-else class="i-lucide-refresh-cw h-4 w-4 mr-2" />
          {{ pending ? '刷新中...' : '刷新统计' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'

// 获取缓存统计信息
const { data, pending, error, refresh } = await useFetch('/api/cache/stats');

// 清空缓存状态
const clearing = ref(false);

// 清空缓存函数
const clearCache = async () => {
  if (clearing.value) return;

  try {
    clearing.value = true;
    await $fetch('/api/cache/clear', { method: 'POST' });

    // 清空后刷新统计
    await refresh();

    // 显示成功消息
    toast.success('缓存已清空', {
      description: '所有缓存数据已成功清理'
    });
  } catch (error) {
    console.error('清空缓存失败:', error);
    toast.error('清空缓存失败', {
      description: error instanceof Error ? error.message : '请稍后重试'
    });
  } finally {
    clearing.value = false;
  }
};
</script>

<style scoped>
.cache-stats {
  min-height: 120px;
}
</style>
