<template>
  <div class="config-info p-6 bg-gray-50 rounded-lg">
    <h2 class="text-2xl font-bold mb-4 text-gray-800">系统配置信息</h2>

    <div v-if="pending" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      <p class="mt-2 text-gray-600">加载配置信息...</p>
    </div>

    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <strong>错误:</strong> 无法加载配置信息
    </div>

    <div v-else-if="data" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-semibold text-gray-700 mb-2">基本信息</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">版本:</span>
            <span class="font-mono">{{ data.version }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">运行时:</span>
            <span class="font-mono">{{ data.runtime }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">环境:</span>
            <span class="font-mono" :class="envClass">{{ data.nodeEnv }}</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-semibold text-gray-700 mb-2">配置状态</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">Token认证:</span>
            <span class="text-orange-600 font-semibold">
              {{ data.tokenAuth || '已禁用' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">自定义弹幕服务器:</span>
            <span :class="data.hasCustomOtherServer ? 'text-green-600' : 'text-gray-500'">
              {{ data.hasCustomOtherServer ? '是' : '否' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">自定义VOD服务器:</span>
            <span :class="data.hasCustomVodServer ? 'text-green-600' : 'text-gray-500'">
              {{ data.hasCustomVodServer ? '是' : '否' }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-semibold text-gray-700 mb-2">性能配置</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">请求超时:</span>
            <span class="font-mono">{{ data.requestTimeout }}ms</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">最大重试:</span>
            <span class="font-mono">{{ data.maxRetryCount }}次</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">最大日志:</span>
            <span class="font-mono">{{ data.maxLogs }}条</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">最大缓存:</span>
            <span class="font-mono">{{ data.maxAnimes }}个</span>
          </div>
        </div>
      </div>

      <div class="bg-white p-4 rounded shadow">
        <h3 class="font-semibold text-gray-700 mb-2">支持的平台</h3>
        <div class="flex flex-wrap gap-2 mt-2">
          <span v-for="platform in data.allowedPlatforms" :key="platform"
            class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            {{ platform }}
          </span>
        </div>
      </div>
    </div>

    <div class="mt-6 text-center">
      <button @click="refresh()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        :disabled="pending">
        {{ pending ? '刷新中...' : '刷新配置' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 获取配置信息
const { data, pending, error, refresh } = await useFetch('/api/config');

// 环境样式
const envClass = computed(() => {
  if (!data.value?.nodeEnv) return 'text-gray-500';

  switch (data.value.nodeEnv) {
    case 'production':
      return 'text-green-600 font-semibold';
    case 'development':
      return 'text-blue-600';
    case 'test':
      return 'text-yellow-600';
    default:
      return 'text-gray-500';
  }
});
</script>

<style scoped>
.config-info {
  max-width: 800px;
  margin: 0 auto;
}
</style>
