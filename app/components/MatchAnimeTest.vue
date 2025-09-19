<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">匹配动漫</h3>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        POST /api/v2/match
      </span>
    </div>

    <!-- 输入表单 -->
    <div class="space-y-4 mb-6">
      <div>
        <label for="fileName" class="block text-sm font-medium text-gray-700 mb-1">
          文件名 <span class="text-red-500">*</span>
        </label>
        <input id="fileName" v-model="form.fileName" type="text" placeholder="如：进击的巨人 S01E01 或 鬼灭之刃 第1集"
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          @keyup.enter="matchAnime" />
        <p class="mt-1 text-xs text-gray-500">
          支持格式：动漫名称 S01E01、动漫名称 第1集、动漫名称.mkv 等
        </p>
      </div>

      <!-- 常用示例 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">常用示例</label>
        <div class="flex flex-wrap gap-2">
          <button v-for="example in examples" :key="example" @click="form.fileName = example" type="button"
            class="px-3 py-1 text-xs border border-gray-300 rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            {{ example }}
          </button>
        </div>
      </div>

      <button @click="matchAnime" :disabled="loading || !form.fileName.trim()"
        class="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed">
        <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        {{ loading ? '匹配中...' : '匹配动漫' }}
      </button>
    </div>

    <!-- 文件名解析结果 -->
    <div v-if="parsedInfo" class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h5 class="text-sm font-medium text-blue-900 mb-2">文件名解析结果</h5>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span class="font-medium text-blue-800">标题:</span>
          <span class="ml-2 text-blue-700">{{ parsedInfo.title || '未识别' }}</span>
        </div>
        <div>
          <span class="font-medium text-blue-800">季度:</span>
          <span class="ml-2 text-blue-700">{{ parsedInfo.season || '未指定' }}</span>
        </div>
        <div>
          <span class="font-medium text-blue-800">集数:</span>
          <span class="ml-2 text-blue-700">{{ parsedInfo.episode || '未指定' }}</span>
        </div>
      </div>
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

    <!-- 匹配结果 -->
    <div v-if="result">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-md font-medium text-gray-900">匹配结果</h4>
        <div class="flex items-center space-x-3">
          <span :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            result.isMatched ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          ]">
            {{ result.isMatched ? '匹配成功' : '未找到匹配' }}
          </span>
          <div class="text-sm text-gray-500">耗时: {{ responseTime }}ms</div>
        </div>
      </div>

      <!-- 匹配的动漫信息 -->
      <div v-if="result.isMatched && result.matches && result.matches.length > 0" class="space-y-4">
        <div v-for="match in result.matches" :key="match.episodeId"
          class="bg-green-50 rounded-lg p-4 border border-green-200">
          <div class="flex items-start space-x-4">
            <img v-if="match.imageUrl" :src="match.imageUrl" :alt="match.animeTitle"
              class="w-16 h-20 object-cover rounded-md flex-shrink-0" @error="$event.target.style.display = 'none'" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-2">
                <h5 class="text-lg font-medium text-green-900">{{ match.animeTitle }}</h5>
                <div class="text-sm text-green-700">
                  <span class="font-medium">{{ match.episodeTitle }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span class="font-medium text-green-800">动漫ID:</span>
                  <span class="ml-1 text-green-700">{{ match.animeId }}</span>
                </div>
                <div>
                  <span class="font-medium text-green-800">集数ID:</span>
                  <span class="ml-1 text-green-700">{{ match.episodeId }}</span>
                </div>
                <div>
                  <span class="font-medium text-green-800">类型:</span>
                  <span class="ml-1 text-green-700">{{ match.type }}</span>
                </div>
                <div>
                  <span class="font-medium text-green-800">时移:</span>
                  <span class="ml-1 text-green-700">{{ match.shift }}s</span>
                </div>
              </div>

              <div v-if="match.typeDescription" class="mt-2 text-sm text-green-600">
                {{ match.typeDescription }}
              </div>

              <!-- 操作按钮 -->
              <div class="mt-3 flex space-x-2">
                <button @click="copyEpisodeId(match.episodeId)"
                  class="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                  复制集数ID
                </button>
                <button @click="copyAnimeId(match.animeId)"
                  class="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                  复制动漫ID
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 未匹配提示 -->
      <div v-else class="text-center py-8 text-gray-500">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-2">没有找到匹配的动漫</p>
        <p class="mt-1 text-sm">请尝试调整文件名格式或检查动漫名称是否正确</p>
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
import { ref, reactive, watch } from 'vue'

const examples = [
  '进击的巨人 S01E01',
  '鬼灭之刃 第1集',
  '咒术回战 S02E05',
  '间谍过家家 movie',
  '你的名字.mkv',
  'One Piece S01E1000'
]

const form = reactive({
  fileName: ''
})

const loading = ref(false)
const error = ref('')
const result = ref(null)
const rawResponse = ref(null)
const responseTime = ref(0)
const parsedInfo = ref(null)

// 简单的文件名解析函数（前端预览）
const parseFileName = (fileName) => {
  const seasonMatch = fileName.match(/S(\d+)E(\d+)/i)
  const episodeMatch = fileName.match(/第(\d+)集/i)
  const movieMatch = fileName.match(/movie/i)

  let title = fileName
  let season = null
  let episode = null

  if (seasonMatch) {
    season = parseInt(seasonMatch[1])
    episode = parseInt(seasonMatch[2])
    title = fileName.replace(/S\d+E\d+/i, '').trim()
  } else if (episodeMatch) {
    episode = parseInt(episodeMatch[1])
    title = fileName.replace(/第\d+集/i, '').trim()
  } else if (movieMatch) {
    episode = 'movie'
    title = fileName.replace(/movie/i, '').trim()
  }

  // 清理文件扩展名和多余空格
  title = title.replace(/\.(mkv|mp4|avi|rmvb|flv)$/i, '').trim()

  return { title, season, episode }
}

// 监听文件名变化，实时解析
watch(() => form.fileName, (newValue) => {
  if (newValue.trim()) {
    parsedInfo.value = parseFileName(newValue.trim())
  } else {
    parsedInfo.value = null
  }
})

const matchAnime = async () => {
  if (!form.fileName.trim()) {
    error.value = '请输入文件名'
    return
  }

  try {
    loading.value = true
    error.value = ''
    result.value = null
    rawResponse.value = null

    const startTime = Date.now()

    const response = await $fetch('/api/v2/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        fileName: form.fileName.trim()
      }
    })

    responseTime.value = Date.now() - startTime
    rawResponse.value = response

    if (response.success) {
      result.value = response
    } else {
      error.value = response.errorMessage || '匹配失败'
    }
  } catch (err) {
    error.value = `请求失败: ${err.message || err}`
    responseTime.value = Date.now() - startTime
  } finally {
    loading.value = false
  }
}

const copyEpisodeId = (episodeId) => {
  navigator.clipboard.writeText(episodeId.toString())
    .then(() => {
      console.log('集数ID已复制到剪贴板')
    })
    .catch(() => {
      console.error('复制失败')
    })
}

const copyAnimeId = (animeId) => {
  navigator.clipboard.writeText(animeId.toString())
    .then(() => {
      console.log('动漫ID已复制到剪贴板')
    })
    .catch(() => {
      console.error('复制失败')
    })
}
</script>
