<template>
  <div class="bg-white rounded-lg shadow-sm border p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">API概览</h2>
      <button @click="refreshOverview" :disabled="loading"
        class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
        <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <svg v-else class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        刷新
      </button>
    </div>

    <div v-if="error" class="mb-4 p-4 bg-red-50 border-l-4 border-red-400">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <div v-if="overview" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- 服务状态 -->
      <div class="bg-green-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-green-900">服务状态</p>
            <p class="text-2xl font-semibold text-green-600">正常</p>
          </div>
        </div>
      </div>

      <!-- 版本信息 -->
      <div class="bg-blue-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-blue-900">版本</p>
            <p class="text-2xl font-semibold text-blue-600">{{ overview.version }}</p>
          </div>
        </div>
      </div>

      <!-- 动漫数据 -->
      <div class="bg-purple-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-purple-900">动漫数据</p>
            <p class="text-2xl font-semibold text-purple-600">{{ overview.stats?.anime?.count || 0 }}</p>
          </div>
        </div>
      </div>

      <!-- 集数数据 -->
      <div class="bg-orange-50 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <svg class="h-8 w-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v10a1 1 0 001 1h8a1 1 0 001-1V7M7 7h10M9 11v4m2-4v4m2-4v4" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-orange-900">集数数据</p>
            <p class="text-2xl font-semibold text-orange-600">{{ overview.stats?.episodes?.count || 0 }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- API端点列表 -->
    <div v-if="overview" class="mt-6">
      <h3 class="text-lg font-medium text-gray-900 mb-3">可用端点</h3>
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div v-for="(endpoint, key) in overview.endpoints" :key="key" class="flex items-center">
            <span class="inline-block w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            <code class="text-gray-700">{{ typeof endpoint === 'string' ? endpoint : JSON.stringify(endpoint) }}</code>
          </div>
        </div>
      </div>
    </div>

    <!-- 支持的平台 -->
    <div v-if="overview?.supportedPlatforms" class="mt-6">
      <h3 class="text-lg font-medium text-gray-900 mb-3">支持的平台</h3>
      <div class="flex flex-wrap gap-2">
        <span v-for="platform in overview.supportedPlatforms" :key="platform"
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {{ platform }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const overview = ref(null)
const loading = ref(false)
const error = ref('')

const fetchOverview = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch('/api')
    if (response.success) {
      overview.value = response.data
    } else {
      error.value = response.errorMessage || '获取API概览失败'
    }
  } catch (err) {
    error.value = `请求失败: ${err.message || err}`
  } finally {
    loading.value = false
  }
}

const refreshOverview = () => {
  fetchOverview()
}

onMounted(() => {
  fetchOverview()
})
</script>
