<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">搜索集数</h3>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        GET /api/v2/search/episodes
      </span>
    </div>

    <!-- 输入表单 -->
    <div class="space-y-4 mb-6">
      <div>
        <label for="anime" class="block text-sm font-medium text-gray-700 mb-1">
          动漫名称 <span class="text-red-500">*</span>
        </label>
        <input id="anime" v-model="form.anime" type="text" placeholder="请输入动漫名称，如：进击的巨人"
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          @keyup.enter="searchEpisodes" />
      </div>

      <div>
        <label for="episode" class="block text-sm font-medium text-gray-700 mb-1">集数过滤（可选）</label>
        <div class="flex space-x-2">
          <input id="episode" v-model="form.episode" type="text" placeholder="如：1、movie 或留空查询所有集数"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          <button @click="form.episode = 'movie'" type="button"
            class="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            剧场版
          </button>
        </div>
        <p class="mt-1 text-xs text-gray-500">
          输入数字查询特定集数，输入"movie"查询剧场版，留空查询所有集数
        </p>
      </div>

      <button @click="searchEpisodes" :disabled="loading || !form.anime.trim()"
        class="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
        <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        {{ loading ? '搜索中...' : '搜索集数' }}
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
          搜索结果 ({{ result.animes?.length || 0 }} 个动漫)
        </h4>
        <div class="text-sm text-gray-500">
          耗时: {{ responseTime }}ms
        </div>
      </div>

      <div v-if="result.animes && result.animes.length > 0" class="space-y-4 max-h-96 overflow-y-auto">
        <div v-for="anime in result.animes" :key="anime.animeId" class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <h5 class="text-sm font-medium text-gray-900">{{ anime.animeTitle }}</h5>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span>ID: {{ anime.animeId }}</span>
              <span v-if="anime.type">{{ anime.type }}</span>
            </div>
          </div>

          <div v-if="anime.typeDescription" class="text-xs text-gray-600 mb-3">
            {{ anime.typeDescription }}
          </div>

          <!-- 集数列表 -->
          <div v-if="anime.episodes && anime.episodes.length > 0" class="space-y-2">
            <h6 class="text-xs font-medium text-gray-700">
              集数列表 ({{ anime.episodes.length }} 集)
            </h6>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <div v-for="episode in anime.episodes" :key="episode.episodeId"
                class="bg-white rounded px-3 py-2 text-xs border hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                @click="selectEpisode(episode)">
                <div class="font-medium text-gray-900">{{ episode.episodeTitle }}</div>
                <div class="text-gray-500">ID: {{ episode.episodeId }}</div>
              </div>
            </div>
          </div>

          <div v-else class="text-xs text-gray-500 italic">
            没有找到符合条件的集数
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8 text-gray-500">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-2">没有找到相关动漫或集数</p>
      </div>
    </div>

    <!-- 选中的集数信息 -->
    <div v-if="selectedEpisode" class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h5 class="text-sm font-medium text-blue-900 mb-2">选中的集数</h5>
      <div class="text-sm text-blue-800">
        <div><strong>标题:</strong> {{ selectedEpisode.episodeTitle }}</div>
        <div><strong>集数ID:</strong> {{ selectedEpisode.episodeId }}</div>
      </div>
      <div class="mt-2 flex space-x-2">
        <button @click="copyEpisodeId" class="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
          复制集数ID
        </button>
        <button @click="selectedEpisode = null"
          class="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">
          清除选择
        </button>
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
  anime: '',
  episode: ''
})

const loading = ref(false)
const error = ref('')
const result = ref(null)
const rawResponse = ref(null)
const responseTime = ref(0)
const selectedEpisode = ref(null)

const searchEpisodes = async () => {
  if (!form.anime.trim()) {
    error.value = '请输入动漫名称'
    return
  }

  try {
    loading.value = true
    error.value = ''
    result.value = null
    rawResponse.value = null
    selectedEpisode.value = null

    const startTime = Date.now()

    // 构建查询参数
    const params = new URLSearchParams()
    params.append('anime', form.anime.trim())

    if (form.episode.trim()) {
      params.append('episode', form.episode.trim())
    }

    const response = await $fetch(`/api/v2/search/episodes?${params.toString()}`)

    responseTime.value = Date.now() - startTime
    rawResponse.value = response

    if (response.success) {
      result.value = response.data
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

const selectEpisode = (episode) => {
  selectedEpisode.value = episode
}

const copyEpisodeId = () => {
  if (selectedEpisode.value) {
    navigator.clipboard.writeText(selectedEpisode.value.episodeId.toString())
      .then(() => {
        // 可以添加一个简单的提示
        console.log('集数ID已复制到剪贴板')
      })
      .catch(() => {
        console.error('复制失败')
      })
  }
}
</script>
