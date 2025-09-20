<template>
  <Card>
    <CardContent class="flex flex-col">
      <CardHeader class="px-0 pt-0">
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg">日志查看</CardTitle>
          <Badge variant="secondary" class="text-xs">
            GET /api/logs
          </Badge>
        </div>
      </CardHeader>

      <!-- 控制面板 -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex gap-2">
          <Button @click="fetchLogs" :disabled="loading" variant="outline">
            <div v-if="loading" class="i-lucide-refresh-cw animate-spin h-4 w-4 mr-2" />
            <div v-else class="i-lucide-refresh-cw h-4 w-4 mr-2" />
            {{ loading ? '获取中...' : '刷新日志' }}
          </Button>

          <Button @click="clearLogs" :disabled="!logs" variant="outline">
            <div class="i-lucide-trash-2 h-4 w-4 mr-2" />
            清空显示
          </Button>
        </div>

        <div class="flex items-center gap-4">
          <!-- 自动刷新开关 -->
          <label class="inline-flex items-center cursor-pointer">
            <input v-model="autoRefresh" type="checkbox"
              class="h-4 w-4 text-primary border-border rounded focus:ring-primary" />
            <span class="ml-2 text-sm text-foreground">自动刷新</span>
          </label>

          <!-- 日志级别过滤 -->
          <select v-model="logLevel"
            class="text-sm border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">所有级别</option>
            <option value="ERROR">错误</option>
            <option value="WARN">警告</option>
            <option value="INFO">信息</option>
            <option value="DEBUG">调试</option>
          </select>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="mb-4 rounded-md bg-destructive/15 border border-destructive/20 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <div class="i-lucide-alert-circle h-5 w-5 text-destructive" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- 日志统计 -->
      <div v-if="logStats" class="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card class="bg-red-50 border-red-200">
          <CardContent class="p-3">
            <div class="text-sm font-medium text-red-900">错误</div>
            <div class="text-2xl font-bold text-red-600">{{ logStats.ERROR || 0 }}</div>
          </CardContent>
        </Card>
        <Card class="bg-yellow-50 border-yellow-200">
          <CardContent class="p-3">
            <div class="text-sm font-medium text-yellow-900">警告</div>
            <div class="text-2xl font-bold text-yellow-600">{{ logStats.WARN || 0 }}</div>
          </CardContent>
        </Card>
        <Card class="bg-blue-50 border-blue-200">
          <CardContent class="p-3">
            <div class="text-sm font-medium text-blue-900">信息</div>
            <div class="text-2xl font-bold text-blue-600">{{ logStats.INFO || 0 }}</div>
          </CardContent>
        </Card>
        <Card class="bg-muted border-border">
          <CardContent class="p-3">
            <div class="text-sm font-medium text-foreground">调试</div>
            <div class="text-2xl font-bold text-muted-foreground">{{ logStats.DEBUG || 0 }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- 日志内容 -->
      <Card v-if="logs" class="bg-slate-900 border-slate-700">
        <CardContent class="p-4">
          <ScrollArea class="h-96">
            <div class="font-mono text-sm flex flex-col gap-1">
              <div v-for="(log, index) in filteredLogs" :key="index" :class="[
                'whitespace-pre-wrap break-words',
                getLogLevelStyle(log)
              ]">
                {{ log }}
              </div>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredLogs.length === 0" class="text-center py-8">
              <div class="i-lucide-file-text mx-auto h-12 w-12 text-muted-foreground/60" />
              <p class="mt-2 text-muted-foreground">{{ logLevel ? `没有 ${logLevel} 级别的日志` : '没有日志数据' }}</p>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <!-- 初始状态 -->
      <div v-else-if="!loading" class="text-center py-8">
        <div class="i-lucide-file-text mx-auto h-12 w-12 text-muted-foreground/60" />
        <p class="mt-2 text-muted-foreground">点击“刷新日志”按钮获取日志数据</p>
      </div>

      <!-- 日志操作 -->
      <div v-if="logs" class="mt-4 flex justify-between items-center text-sm text-muted-foreground">
        <div>
          显示 {{ filteredLogs.length }} / {{ totalLogs }} 条日志
          <span v-if="lastUpdate" class="ml-2">
            最后更新: {{ lastUpdate }}
          </span>
        </div>
        <div class="flex gap-2">
          <Button @click="scrollToTop" size="sm" variant="secondary">
            回到顶部
          </Button>
          <Button @click="scrollToBottom" size="sm" variant="secondary">
            回到底部
          </Button>
          <Button @click="downloadLogs" size="sm">
            <div class="i-lucide-download h-3 w-3 mr-1" />
            下载日志
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

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
