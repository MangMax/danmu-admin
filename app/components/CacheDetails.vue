<template>
  <Card class="cache-details">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="flex items-center gap-2">
          <div class="i-lucide-database h-5 w-5" />
          缓存数据详情
        </CardTitle>
        <div class="flex gap-2">
          <Button @click="addSampleData" :disabled="addingData" variant="default" size="sm">
            <div v-if="!addingData" class="i-lucide-flask-conical h-4 w-4 mr-2" />
            <div v-else class="i-lucide-refresh-cw h-4 w-4 mr-2 animate-spin" />
            添加测试数据
          </Button>
          <Button @click="refreshData" :disabled="refreshing" variant="outline" size="sm">
            <div :class="['i-lucide-refresh-cw h-4 w-4 mr-2', { 'animate-spin': refreshing }]" />
            刷新
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>

      <div v-if="pending" class="text-center py-8">
        <div class="inline-flex items-center">
          <div class="i-lucide-refresh-cw animate-spin h-6 w-6 mr-2 text-muted-foreground" />
          <p class="text-muted-foreground">加载缓存数据中...</p>
        </div>
      </div>

      <div v-else-if="error" class="rounded-md bg-destructive/15 border border-destructive/20 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="i-lucide-alert-circle h-5 w-5 text-destructive mr-2" />
            <span class="text-destructive">加载失败: {{ error }}</span>
          </div>
          <Button @click="refreshData" variant="outline" size="sm">重试</Button>
        </div>
      </div>

      <div v-else-if="data" class="cache-content">
        <!-- 统计概览 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card class="text-center">
            <CardContent class="p-4">
              <div class="text-2xl font-bold text-blue-600">{{ stats.animeCount || 0 }}</div>
              <div class="text-sm text-muted-foreground">番剧数</div>
            </CardContent>
          </Card>
          <Card class="text-center">
            <CardContent class="p-4">
              <div class="text-2xl font-bold text-green-600">{{ stats.episodeCount || 0 }}</div>
              <div class="text-sm text-muted-foreground">集数记录</div>
            </CardContent>
          </Card>
          <Card class="text-center">
            <CardContent class="p-4">
              <div class="text-2xl font-bold text-purple-600">{{ stats.totalItems || 0 }}</div>
              <div class="text-sm text-muted-foreground">总缓存项</div>
            </CardContent>
          </Card>
        </div>

        <!-- 番剧列表 -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <div class="i-lucide-film h-5 w-5" />
            番剧列表 ({{ animes.length }})
            <Badge v-if="animes.length === 0" variant="outline" class="text-xs">
              暂无数据，请先使用搜索功能
            </Badge>
          </h4>

          <div v-if="animes.length > 0">
            <Table sticky-header height="400px">
              <TableHeader sticky>
                <TableRow>
                  <TableHead sticky>番剧名称</TableHead>
                  <TableHead sticky>ID</TableHead>
                  <TableHead sticky>类型</TableHead>
                  <TableHead sticky>集数</TableHead>
                  <TableHead sticky>评分</TableHead>
                  <TableHead sticky class="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="anime in animes" :key="anime.animeId">
                  <TableCell class="font-medium">{{ anime.animeTitle }}</TableCell>
                  <TableCell>
                    <Badge variant="outline">#{{ anime.animeId }}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{{ anime.type || '未知类型' }}</Badge>
                  </TableCell>
                  <TableCell>{{ anime.episodeCount || 1 }}集</TableCell>
                  <TableCell>
                    <Badge v-if="anime.rating" variant="secondary">⭐ {{ anime.rating }}</Badge>
                    <span v-else class="text-muted-foreground">-</span>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button @click="testAnime(anime.animeId)" variant="outline" size="sm">
                        <div class="i-lucide-flask-conical h-3 w-3 mr-1" />
                        测试
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <a :href="`/api/v2/bangumi/${anime.animeId}`" target="_blank">
                          <div class="i-lucide-external-link h-3 w-3 mr-1" />
                          API
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        <!-- 集数数据 -->
        <div class="mb-6">
          <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <div class="i-lucide-tv h-5 w-5" />
            集数数据 ({{ episodes.length }})
            <Badge variant="outline" class="text-xs">commentId弹幕ID</Badge>
          </h4>

          <div v-if="episodes.length > 0">
            <Table sticky-header height="500px">
              <TableHeader sticky>
                <TableRow>
                  <TableHead sticky>ID</TableHead>
                  <TableHead sticky>标题</TableHead>
                  <TableHead sticky>URL</TableHead>
                  <TableHead sticky class="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="episode in episodes.slice(0, showAllEpisodes ? episodes.length : 10)"
                  :key="episode.id">
                  <TableCell>
                    <div class="flex items-center gap-2">
                      <Badge variant="outline">{{ episode.id }}</Badge>
                      <Badge variant="secondary" class="text-xs">commentId</Badge>
                    </div>
                  </TableCell>
                  <TableCell class="font-medium">{{ episode.title || `Episode ${episode.id}` }}</TableCell>
                  <TableCell>
                    <code class="text-xs bg-muted px-2 py-1 rounded">{{ truncateUrl(episode.url) }}</code>
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex gap-2 justify-end">
                      <Button asChild variant="outline" size="sm">
                        <a :href="`/api/v2/comment/${episode.id}`" target="_blank">
                          <div class="i-lucide-message-circle h-3 w-3 mr-1" />
                          获取弹幕
                        </a>
                      </Button>
                      <Button @click="testComment(episode.id)" variant="outline" size="sm">
                        <div class="i-lucide-flask-conical h-3 w-3 mr-1" />
                        测试
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <div v-if="episodes.length > 10" class="mt-4 text-center">
              <Button @click="showAllEpisodes = !showAllEpisodes" variant="outline">
                {{ showAllEpisodes ? '收起' : `显示全部 (${episodes.length - 10} 条记录)` }}
              </Button>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <div class="i-lucide-file-x mx-auto h-12 w-12 text-muted-foreground/60" />
            <p class="mt-2 text-muted-foreground">暂无集数数据</p>
          </div>
        </div>

        <!-- 测试结果 -->
        <div v-if="testResult" class="mb-6">
          <h4 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <div class="i-lucide-flask-conical h-5 w-5" />
            测试结果
          </h4>
          <Card :class="testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'">
            <CardContent>
              <ScrollArea class="h-60">
                <pre class="text-xs">{{ JSON.stringify(testResult.data, null, 2) }}</pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <!-- 更新时间 -->
        <div class="text-center pt-4 border-t">
          <Badge variant="outline" class="text-xs">
            <div class="i-lucide-clock h-3 w-3 mr-1" />
            最后更新: {{ formatTime(data.timestamp) }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { toast } from 'vue-sonner'

// 响应式数据
const { data, pending, error, refresh } = await useFetch('/api/cache/details')
const refreshing = ref(false)
const addingData = ref(false)
const testResult = ref(null)
const showAllEpisodes = ref(false)

// 刷新数据
const refreshData = async () => {
  refreshing.value = true
  try {
    await refresh()
    testResult.value = null // 清除之前的测试结果
  } finally {
    refreshing.value = false
  }
}

// 添加测试数据
const addSampleData = async () => {
  addingData.value = true
  try {
    const response = await $fetch('/api/test/add-sample-data', {
      method: 'POST'
    })

    if (response.success) {
      testResult.value = {
        success: true,
        type: 'sample-data',
        data: response
      }
      // 自动刷新数据
      await refresh()
      toast.success('测试数据添加成功', {
        description: '已添加示例数据到缓存'
      });
    } else {
      testResult.value = {
        success: false,
        type: 'sample-data',
        data: response
      }
      toast.error('添加测试数据失败', {
        description: response.errorMessage || '请稍后重试'
      });
    }
  } catch (err) {
    testResult.value = {
      success: false,
      type: 'sample-data',
      data: {
        error: err.message,
        statusCode: err.statusCode
      }
    }
  } finally {
    addingData.value = false
  }
}

// 测试番剧API
const testAnime = async (animeId) => {
  try {
    testResult.value = { loading: true }
    const response = await $fetch(`/api/v2/bangumi/${animeId}`)
    testResult.value = {
      success: true,
      animeId,
      data: response
    }
  } catch (err) {
    testResult.value = {
      success: false,
      animeId,
      data: {
        error: err.message,
        statusCode: err.statusCode
      }
    }
  }
}

const testComment = async (commentId) => {
  try {
    testResult.value = { loading: true }
    const response = await $fetch(`/api/v2/comment/${commentId}`)
    testResult.value = {
      success: true,
      type: 'comment-test',
      data: response
    }
  } catch (err) {
    testResult.value = {
      success: false,
      type: 'comment-test',
      data: {
        error: err.message,
        statusCode: err.statusCode
      }
    }
  }
}

// 工具函数
const truncateUrl = (url) => {
  if (!url) return 'N/A'
  return url.length > 50 ? url.substring(0, 50) + '...' : url
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A'
  return new Date(timestamp).toLocaleString('zh-CN')
}

// 安全访问缓存数据的辅助函数
const cacheData = computed(() => data.value?.data || {})
const animes = computed(() => cacheData.value.animes || [])
const episodes = computed(() => cacheData.value.episodes || [])
const stats = computed(() => cacheData.value.stats || {})
</script>

<style scoped>
.cache-details {
  margin-top: 2rem;
}
</style>
