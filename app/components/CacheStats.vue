<template>
  <div class="cache-stats">
    <div v-if="pending" class="text-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-2 text-sm text-gray-600">加载缓存统计...</p>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
      缓存统计加载失败
    </div>

    <div v-else-if="data" class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600">{{ data.data.animes.totalAnimes }}</div>
        <div class="text-sm text-gray-600">动画缓存</div>
        <div class="text-xs text-gray-500">
          {{ data.data.animes.usagePercentage }}% 已使用
        </div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-green-600">{{ data.data.episodes.totalEpisodes }}</div>
        <div class="text-sm text-gray-600">剧集缓存</div>
        <div class="text-xs text-gray-500">
          {{ data.data.episodes.usagePercentage }}% 已使用
        </div>
      </div>

      <div class="text-center">
        <div class="text-2xl font-bold text-purple-600">{{ data.data.totalItems }}</div>
        <div class="text-sm text-gray-600">总缓存项</div>
        <div class="text-xs text-gray-500">
          <button @click="clearCache" class="text-red-500 hover:text-red-700 underline" :disabled="clearing">
            {{ clearing ? '清理中...' : '清空缓存' }}
          </button>
        </div>
      </div>
    </div>

    <div class="mt-4 text-center">
      <button @click="refresh()"
        class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        :disabled="pending">
        {{ pending ? '刷新中...' : '刷新统计' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
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

    // 显示成功消息（可以用 toast 或其他通知方式）
    console.log('缓存已清空');
  } catch (error) {
    console.error('清空缓存失败:', error);
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
