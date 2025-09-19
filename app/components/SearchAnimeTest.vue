<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">搜索动漫</h3>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        GET /api/v2/search/anime
      </span>
    </div>

    <!-- 输入表单 -->
    <div class="space-y-4 mb-6">
      <div>
        <label for="keyword" class="block text-sm font-medium text-gray-700 mb-1">
          关键词 <span class="text-red-500">*</span>
        </label>
        <input id="keyword" v-model="form.keyword" type="text" placeholder="请输入动漫名称，如：进击的巨人"
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          @keyup.enter="searchAnime" />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label for="providers" class="block text-sm font-medium text-gray-700 mb-1">提供商</label>
          <input id="providers" v-model="form.providers" type="text" placeholder="如：360kan,renren（可选）"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <div>
          <label for="maxResults" class="block text-sm font-medium text-gray-700 mb-1">最大结果数</label>
          <input id="maxResults" v-model.number="form.maxResults" type="number" placeholder="默认：10" min="1" max="50"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>

        <div>
          <label for="season" class="block text-sm font-medium text-gray-700 mb-1">季度</label>
          <input id="season" v-model.number="form.season" type="number" placeholder="如：2023（可选）" min="2000" max="2030"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <button @click="searchAnime" :disabled="loading || !form.keyword.trim()"
        class="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
        <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        {{ loading ? '搜索中...' : '搜索动漫' }}
      </button>
    </div>

    <!-- 错误信息 -->
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

    <!-- 搜索结果 -->
    <div v-if="result">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900">
          搜索结果 ({{ result.animes?.length || 0 }} 个)
        </h4>
        <div class="text-sm text-gray-500">
          耗时: {{ responseTime }}ms
        </div>
      </div>

      <div v-if="result.animes && result.animes.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
        <div v-for="anime in result.animes" :key="anime.animeId"
          class="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div class="flex items-start space-x-4">
            <img v-if="anime.imageUrl" :src="anime.imageUrl" :alt="anime.animeTitle"
              class="w-16 h-20 object-cover rounded-md flex-shrink-0" @error="$event.target.style.display = 'none'" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <h5 class="text-sm font-medium text-gray-900 truncate">{{ anime.animeTitle }}</h5>
                <span class="text-xs text-gray-500">ID: {{ anime.animeId }}</span>
              </div>
              <div class="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                <span v-if="anime.type">类型: {{ anime.type }}</span>
                <span v-if="anime.episodeCount">集数: {{ anime.episodeCount }}</span>
                <span v-if="anime.rating">评分: {{ anime.rating }}</span>
              </div>
              <p v-if="anime.typeDescription" class="mt-1 text-xs text-gray-600">{{ anime.typeDescription }}</p>

              <!-- 播放链接 -->
              <div v-if="anime.playlinks && anime.playlinks.length > 0" class="mt-2">
                <details class="group">
                  <summary class="cursor-pointer text-xs text-blue-600 hover:text-blue-800">
                    查看播放链接 ({{ anime.playlinks.length }} 个)
                  </summary>
                  <div class="mt-1 pl-4 border-l-2 border-gray-200">
                    <div v-for="(link, index) in anime.playlinks.slice(0, 5)" :key="index"
                      class="text-xs text-gray-600 py-1">
                      <span class="font-medium">{{ link.name }}:</span>
                      <code class="ml-1 text-gray-500">{{ link.url }}</code>
                    </div>
                    <div v-if="anime.playlinks.length > 5" class="text-xs text-gray-500 py-1">
                      ... 还有 {{ anime.playlinks.length - 5 }} 个链接
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-2">没有找到相关动漫</p>
      </div>
    </div>

    <!-- 原始响应数据 -->
    <details v-if="rawResponse" class="mt-6">
      <summary class="cursor-pointer text-sm text-gray-600 hover:text-gray-800">查看原始响应数据</summary>
      <pre
        class="mt-2 p-3 bg-gray-100 rounded-md text-xs overflow-auto max-h-40">{{ JSON.stringify(rawResponse, null, 2) }}</pre>
    </details>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const form = reactive({
  keyword: '',
  providers: '',
  maxResults: null,
  season: null
})

const loading = ref(false)
const error = ref('')
const result = ref(null)
const rawResponse = ref(null)
const responseTime = ref(0)

const searchAnime = async () => {
  if (!form.keyword.trim()) {
    error.value = '请输入搜索关键词'
    return
  }

  try {
    loading.value = true
    error.value = ''
    result.value = null
    rawResponse.value = null

    const startTime = Date.now()

    // 构建查询参数
    const params = new URLSearchParams()
    params.append('keyword', form.keyword.trim())

    if (form.providers) {
      params.append('providers', form.providers)
    }
    if (form.maxResults) {
      params.append('maxResults', form.maxResults.toString())
    }
    if (form.season) {
      params.append('season', form.season.toString())
    }

    const response = await $fetch(`/api/v2/search/anime?${params.toString()}`)

    responseTime.value = Date.now() - startTime
    rawResponse.value = response

    if (response.success) {
      result.value = response
    } else {
      error.value = response.errorMessage || '搜索失败'
    }
  } catch (err) {
    error.value = `请求失败: ${err.message || err}`
    responseTime.value = Date.now() - startTime
  } finally {
    loading.value = false
  }
}
</script>
