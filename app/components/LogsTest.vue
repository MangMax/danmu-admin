<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">日志查看</h3>
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        GET /api/logs
      </span>
    </div>

    <!-- 控制面板 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex space-x-2">
        <button @click="fetchLogs" :disabled="loading"
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
          {{ loading ? '获取中...' : '刷新日志' }}
        </button>

        <button @click="clearLogs" :disabled="!logs"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          清空显示
        </button>
      </div>

      <div class="flex items-center space-x-2">
        <!-- 自动刷新开关 -->
        <label class="inline-flex items-center">
          <input v-model="autoRefresh" type="checkbox"
            class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out" />
          <span class="ml-2 text-sm text-gray-700">自动刷新</span>
        </label>

        <!-- 日志级别过滤 -->
        <select v-model="logLevel"
          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">所有级别</option>
          <option value="ERROR">错误</option>
          <option value="WARN">警告</option>
          <option value="INFO">信息</option>
          <option value="DEBUG">调试</option>
        </select>
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

    <!-- 日志统计 -->
    <div v-if="logStats" class="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-red-50 rounded-lg p-3">
        <div class="text-sm font-medium text-red-900">错误</div>
        <div class="text-2xl font-bold text-red-600">{{ logStats.ERROR || 0 }}</div>
      </div>
      <div class="bg-yellow-50 rounded-lg p-3">
        <div class="text-sm font-medium text-yellow-900">警告</div>
        <div class="text-2xl font-bold text-yellow-600">{{ logStats.WARN || 0 }}</div>
      </div>
      <div class="bg-blue-50 rounded-lg p-3">
        <div class="text-sm font-medium text-blue-900">信息</div>
        <div class="text-2xl font-bold text-blue-600">{{ logStats.INFO || 0 }}</div>
      </div>
      <div class="bg-gray-50 rounded-lg p-3">
        <div class="text-sm font-medium text-gray-900">调试</div>
        <div class="text-2xl font-bold text-gray-600">{{ logStats.DEBUG || 0 }}</div>
      </div>
    </div>

    <!-- 日志内容 -->
    <div v-if="logs" class="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
      <div class="font-mono text-sm space-y-1">
        <div v-for="(log, index) in filteredLogs" :key="index" :class="[
          'whitespace-pre-wrap break-words',
          getLogLevelStyle(log)
        ]">
          {{ log }}
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredLogs.length === 0" class="text-center py-8 text-gray-400">
        <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="mt-2">{{ logLevel ? `没有 ${logLevel} 级别的日志` : '没有日志数据' }}</p>
      </div>
    </div>

    <!-- 初始状态 -->
    <div v-else-if="!loading" class="text-center py-8 text-gray-500">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="mt-2">点击"刷新日志"按钮获取日志数据</p>
    </div>

    <!-- 日志操作 -->
    <div v-if="logs" class="mt-4 flex justify-between items-center text-sm text-gray-500">
      <div>
        显示 {{ filteredLogs.length }} / {{ totalLogs }} 条日志
        <span v-if="lastUpdate" class="ml-2">
          最后更新: {{ lastUpdate }}
        </span>
      </div>
      <div class="flex space-x-2">
        <button @click="scrollToTop" class="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
          回到顶部
        </button>
        <button @click="scrollToBottom" class="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
          回到底部
        </button>
        <button @click="downloadLogs" class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
          下载日志
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const loading = ref(false)
const error = ref('')
const logs = ref('')
const logLevel = ref('')
const autoRefresh = ref(false)
const lastUpdate = ref('')
const refreshInterval = ref(null)

const logLines = computed(() => {
  if (!logs.value) return []
  return logs.value.split('\n').filter(line => line.trim())
})

const totalLogs = computed(() => logLines.value.length)

const filteredLogs = computed(() => {
  if (!logLevel.value) return logLines.value
  return logLines.value.filter(log => log.includes(logLevel.value))
})

const logStats = computed(() => {
  const stats = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0 }
  logLines.value.forEach(log => {
    if (log.includes('ERROR')) stats.ERROR++
    else if (log.includes('WARN')) stats.WARN++
    else if (log.includes('INFO')) stats.INFO++
    else if (log.includes('DEBUG')) stats.DEBUG++
  })
  return stats
})

const fetchLogs = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch('/api/logs', {
      headers: {
        'Accept': 'text/plain'
      }
    })

    logs.value = response
    lastUpdate.value = new Date().toLocaleTimeString()
  } catch (err) {
    error.value = `获取日志失败: ${err.message || err}`
  } finally {
    loading.value = false
  }
}

const clearLogs = () => {
  logs.value = ''
  lastUpdate.value = ''
}

const getLogLevelStyle = (log) => {
  if (log.includes('ERROR')) return 'text-red-400'
  if (log.includes('WARN')) return 'text-yellow-400'
  if (log.includes('INFO')) return 'text-blue-400'
  if (log.includes('DEBUG')) return 'text-gray-400'
  return 'text-white'
}

const scrollToTop = () => {
  const container = document.querySelector('.overflow-y-auto')
  if (container) {
    container.scrollTop = 0
  }
}

const scrollToBottom = () => {
  const container = document.querySelector('.overflow-y-auto')
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

const downloadLogs = () => {
  if (!logs.value) return

  const blob = new Blob([logs.value], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `danmu-api-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 监听自动刷新开关
watch(autoRefresh, (newValue) => {
  if (newValue) {
    refreshInterval.value = setInterval(fetchLogs, 5000) // 每5秒刷新一次
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }
})

// 组件挂载时自动获取一次日志
onMounted(() => {
  fetchLogs()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>
