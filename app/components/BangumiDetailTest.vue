<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg">番剧详情</CardTitle>
        <Badge variant="secondary" class="text-xs">
          GET /api/v2/bangumi/[animeId]
        </Badge>
      </div>
    </CardHeader>
    <CardContent class="p-6">

      <!-- 输入表单 -->
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col gap-2">
          <Label for="animeId">
            动漫ID <span class="text-destructive">*</span>
          </Label>
          <Input id="animeId" v-model.number="form.animeId" type="number" placeholder="请输入动漫ID，如：12345"
            @keyup.enter="fetchBangumi" />
          <p class="mt-1 text-xs text-muted-foreground">
            可以从搜索动漫的结果中获取动漫ID
          </p>
        </div>

        <!-- 快速输入 -->
        <div class="flex flex-col gap-2">
          <Label class="text-sm font-medium">快速输入</Label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="exampleId in exampleIds" :key="exampleId" @click="form.animeId = exampleId" type="button"
              variant="outline" size="sm" class="text-xs">
              {{ exampleId }}
            </Button>
          </div>
        </div>

        <Button @click="fetchBangumi" :disabled="loading || !form.animeId"
          class="w-full bg-indigo-600 hover:bg-indigo-700">
          <div v-if="loading" class="i-lucide-refresh-cw animate-spin h-4 w-4 mr-2" />
          <div v-else class="i-lucide-search h-4 w-4 mr-2" />
          {{ loading ? '获取中...' : '获取番剧详情' }}
        </Button>
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

      <!-- 番剧详情 -->
      <div v-if="result" class="flex flex-col gap-6">
        <div class="flex items-center justify-between">
          <h4 class="text-md font-medium text-foreground">番剧信息</h4>
          <Badge variant="outline" class="text-xs">耗时: {{ responseTime }}ms</Badge>
        </div>

        <!-- 基本信息 -->
        <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <div class="flex items-start gap-6">
            <!-- 封面图 -->
            <div class="flex-shrink-0">
              <img v-if="result.imageUrl" :src="result.imageUrl" :alt="result.animeTitle"
                class="w-24 h-32 object-cover rounded-lg shadow-md" @error="$event.target.style.display = 'none'" />
              <div v-else class="w-24 h-32 bg-muted rounded-lg flex items-center justify-center">
                <div class="i-lucide-image h-8 w-8 text-muted-foreground" />
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
                      <div v-for="i in 5" :key="i" :class="[
                        'i-lucide-star w-3 h-3',
                        i <= Math.floor(result.rating / 2) ? 'text-yellow-400' : 'text-muted-foreground'
                      ]" />
                    </div>
                  </div>
                </div>
                <div>
                  <span class="font-medium text-indigo-800">播出状态:</span>
                  <Badge :variant="result.isOnAir ? 'default' : 'secondary'" class="ml-2">
                    {{ result.isOnAir ? '播出中' : '已完结' }}
                  </Badge>
                </div>
                <div>
                  <span class="font-medium text-indigo-800">收藏状态:</span>
                  <Badge :variant="result.isFavorited ? 'destructive' : 'secondary'" class="ml-2">
                    {{ result.isFavorited ? '已收藏' : '未收藏' }}
                  </Badge>
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
          <h5 class="text-lg font-medium text-foreground mb-3">季度信息</h5>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="season in result.seasons" :key="season.id"
              class="bg-white rounded-lg border hover:border-indigo-300 transition-colors p-4">
              <div class="flex items-center justify-between mb-2">
                <h6 class="font-medium text-foreground">{{ season.name }}</h6>
                <Badge variant="secondary" class="text-xs">{{ season.episodeCount }} 集</Badge>
              </div>
              <div class="text-sm text-muted-foreground">
                播出时间: {{ new Date(season.airDate).toLocaleDateString() }}
              </div>
            </div>
          </div>
        </div>

        <!-- 集数列表 -->
        <div v-if="result.episodes && result.episodes.length > 0">
          <div class="flex items-center justify-between mb-3">
            <h5 class="text-lg font-medium text-foreground">集数列表</h5>
            <Badge variant="outline">共 {{ result.episodes.length }} 集</Badge>
          </div>

          <div class="bg-white rounded-lg border">
            <ScrollArea class="h-64">
              <div class="divide-y">
                <div v-for="episode in result.episodes" :key="episode.episodeId"
                  class="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors" @click="selectEpisode(episode)">
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-medium text-foreground">{{ episode.episodeTitle }}</div>
                      <div class="text-sm text-muted-foreground">第 {{ episode.episodeNumber }} 集</div>
                    </div>
                    <div class="text-right">
                      <div class="text-sm font-medium text-foreground">{{ episode.episodeId }}</div>
                      <div class="text-xs text-muted-foreground">{{ new Date(episode.airDate).toLocaleDateString() }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <!-- 选中的集数信息 -->
        <div v-if="selectedEpisode" class="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h6 class="text-sm font-medium text-indigo-900 mb-4">选中的集数</h6>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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
          <div class="flex gap-2">
            <Button @click="copyEpisodeId" size="sm" class="bg-indigo-600 hover:bg-indigo-700">
              复制集数ID
            </Button>
            <Button @click="selectedEpisode = null" variant="secondary" size="sm">
              清除选择
            </Button>
          </div>
        </div>
      </div>

      <!-- 原始响应数据 -->
      <Collapsible v-if="rawResponse" class="mt-6">
        <CollapsibleTrigger class="flex items-center text-sm text-muted-foreground hover:text-foreground">
          <div class="i-lucide-chevron-right h-4 w-4 mr-1" />
          查看原始响应数据
        </CollapsibleTrigger>
        <CollapsibleContent class="mt-2">
          <ScrollArea class="h-40">
            <pre class="p-3 bg-muted rounded-md text-xs">{{ JSON.stringify(rawResponse, null, 2) }}</pre>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
  </Card>
</template>

<script setup>
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
