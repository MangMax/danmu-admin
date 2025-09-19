<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">番剧详情</h3>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        GET /api/v2/bangumi/[animeId]
      </span>
    </div>

    <!-- 输入表单 -->
    <div class="space-y-4 mb-6">
      <div>
        <label for="animeId" class="block text-sm font-medium text-gray-700 mb-1">
          动漫ID <span class="text-red-500">*</span>
        </label>
        <input id="animeId" v-model.number="form.animeId" type="number" placeholder="请输入动漫ID，如：12345"
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          @keyup.enter="fetchBangumi" />
        <p class="mt-1 text-xs text-gray-500">
          可以从搜索动漫的结果中获取动漫ID
        </p>
      </div>

      <!-- 快速输入 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">快速输入</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="exampleId in exampleIds" :key="exampleId" @click="form.animeId = exampleId" type="button"
            class="px-3 py-1 text-xs border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            {{ exampleId }}
          </button>
        </div>
      </div>

      <button @click="fetchBangumi" :disabled="loading || !form.animeId"
        class="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
        <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        {{ loading ? '获取中...' : '获取番剧详情' }}
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

    <!-- 番剧详情 -->
    <div v-if="result" class="space-y-6">
      <div class="flex items-center justify-between">
        <h4 class="text-md font-medium text-gray-900">番剧信息</h4>
        <div class="text-sm text-gray-500">耗时: {{ responseTime }}ms</div>
      </div>

      <!-- 基本信息 -->
      <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-200">
        <div class="flex items-start space-x-6">
          <!-- 封面图 -->
          <div class="flex-shrink-0">
            <img v-if="result.imageUrl" :src="result.imageUrl" :alt="result.animeTitle"
              class="w-24 h-32 object-cover rounded-lg shadow-md" @error="$event.target.style.display = 'none'" />
            <div v-else class="w-24 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <!-- 详细信息 -->
          <div class="flex-1 min-w-0">
            <h5 class="text-xl font-bold text-indigo-900 mb-2">{{ result.animeTitle }}</h5>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="font-medium text-indigo-800">动漫ID:</span>
                <span class="ml-2 text-indigo-700">{{ result.animeId }}</span>
              </div>
              <div>
                <span class="font-medium text-indigo-800">番剧ID:</span>
                <span class="ml-2 text-indigo-700">{{ result.bangumiId }}</span>
              </div>
              <div>
                <span class="font-medium text-indigo-800">类型:</span>
                <span class="ml-2 text-indigo-700">{{ result.type }}</span>
              </div>
              <div>
                <span class="font-medium text-indigo-800">评分:</span>
                <div class="ml-2 inline-flex items-center">
                  <span class="text-indigo-700">{{ result.rating }}</span>
                  <div class="ml-1 flex">
                    <svg v-for="i in 5" :key="i" :class="[
                      'w-3 h-3',
                      i <= Math.floor(result.rating / 2) ? 'text-yellow-400' : 'text-gray-300'
                    ]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <span class="font-medium text-indigo-800">播出状态:</span>
                <span :class="[
                  'ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  result.isOnAir ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                ]">
                  {{ result.isOnAir ? '播出中' : '已完结' }}
                </span>
              </div>
              <div>
                <span class="font-medium text-indigo-800">收藏状态:</span>
                <span :class="[
                  'ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  result.isFavorited ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                ]">
                  {{ result.isFavorited ? '已收藏' : '未收藏' }}
                </span>
              </div>
            </div>

            <div v-if="result.typeDescription" class="mt-3 text-sm text-indigo-600">
              <span class="font-medium">描述:</span> {{ result.typeDescription }}
            </div>
          </div>
        </div>
      </div>

      <!-- 季度信息 -->
      <div v-if="result.seasons && result.seasons.length > 0">
        <h5 class="text-lg font-medium text-gray-900 mb-3">季度信息</h5>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="season in result.seasons" :key="season.id"
            class="bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 transition-colors">
            <div class="flex items-center justify-between mb-2">
              <h6 class="font-medium text-gray-900">{{ season.name }}</h6>
              <span class="text-xs text-gray-500">{{ season.episodeCount }} 集</span>
            </div>
            <div class="text-sm text-gray-600">
              播出时间: {{ new Date(season.airDate).toLocaleDateString() }}
            </div>
          </div>
        </div>
      </div>

      <!-- 集数列表 -->
      <div v-if="result.episodes && result.episodes.length > 0">
        <div class="flex items-center justify-between mb-3">
          <h5 class="text-lg font-medium text-gray-900">集数列表</h5>
          <span class="text-sm text-gray-500">共 {{ result.episodes.length }} 集</span>
        </div>

        <div class="bg-white rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
          <div class="divide-y divide-gray-200">
            <div v-for="episode in result.episodes" :key="episode.episodeId"
              class="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors" @click="selectEpisode(episode)">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-medium text-gray-900">{{ episode.episodeTitle }}</div>
                  <div class="text-sm text-gray-500">第 {{ episode.episodeNumber }} 集</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-gray-900">{{ episode.episodeId }}</div>
                  <div class="text-xs text-gray-500">{{ new Date(episode.airDate).toLocaleDateString() }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 选中的集数信息 -->
      <div v-if="selectedEpisode" class="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h6 class="text-sm font-medium text-indigo-900 mb-2">选中的集数</h6>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span class="font-medium text-indigo-800">标题:</span>
            <span class="ml-1 text-indigo-700">{{ selectedEpisode.episodeTitle }}</span>
          </div>
          <div>
            <span class="font-medium text-indigo-800">集数ID:</span>
            <span class="ml-1 text-indigo-700">{{ selectedEpisode.episodeId }}</span>
          </div>
          <div>
            <span class="font-medium text-indigo-800">集数:</span>
            <span class="ml-1 text-indigo-700">第{{ selectedEpisode.episodeNumber }}集</span>
          </div>
          <div>
            <span class="font-medium text-indigo-800">季度:</span>
            <span class="ml-1 text-indigo-700">{{ selectedEpisode.seasonId }}</span>
          </div>
        </div>
        <div class="mt-2 flex space-x-2">
          <button @click="copyEpisodeId" class="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            复制集数ID
          </button>
          <button @click="selectedEpisode = null"
            class="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700">
            清除选择
          </button>
        </div>
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

const exampleIds = [12345, 54321, 98765, 11111, 22222]

const form = reactive({
  animeId: null
})

const loading = ref(false)
const error = ref('')
const result = ref(null)
const rawResponse = ref(null)
const responseTime = ref(0)
const selectedEpisode = ref(null)

const fetchBangumi = async () => {
  if (!form.animeId) {
    error.value = '请输入动漫ID'
    return
  }

  try {
    loading.value = true
    error.value = ''
    result.value = null
    rawResponse.value = null
    selectedEpisode.value = null

    const startTime = Date.now()

    const response = await $fetch(`/api/v2/bangumi/${form.animeId}`)

    responseTime.value = Date.now() - startTime
    rawResponse.value = response

    if (response.success) {
      result.value = response.bangumi
    } else {
      error.value = response.errorMessage || '获取番剧详情失败'
    }
  } catch (err) {
    error.value = `请求失败: ${err.message || err}`
    responseTime.value = Date.now() - startTime

    // 如果是404错误，给出更友好的提示
    if (err.statusCode === 404) {
      error.value = '番剧不存在，请检查动漫ID是否正确'
    }
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
        console.log('集数ID已复制到剪贴板')
      })
      .catch(() => {
        console.error('复制失败')
      })
  }
}
</script>
