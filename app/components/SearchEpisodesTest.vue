<template>
  <Card>
    <CardContent class="flex flex-col">
      <CardHeader class="px-0 pt-0">
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg">搜索集数</CardTitle>
          <Badge variant="secondary" class="text-xs">
            GET /api/v2/search/episodes
          </Badge>
        </div>
      </CardHeader>

      <!-- 输入表单 -->
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col gap-2">
          <Label for="anime">
            动漫名称 <span class="text-destructive">*</span>
          </Label>
          <Input id="anime" v-model="form.anime" type="text" placeholder="请输入动漫名称，如：进击的巨人"
            @keyup.enter="searchEpisodes" />
        </div>

        <div class="flex flex-col gap-2">
          <Label for="episode">集数过滤（可选）</Label>
          <div class="flex gap-2">
            <Input id="episode" v-model="form.episode" type="text" placeholder="如：1、movie 或留空查询所有集数" class="flex-1" />
            <Button @click="form.episode = 'movie'" type="button" variant="outline">
              剧场版
            </Button>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            输入数字查询特定集数，输入"movie"查询剧场版，留空查询所有集数
          </p>
        </div>

        <Button @click="searchEpisodes" :disabled="loading || !form.anime.trim()" class="w-full">
          <div v-if="loading" class="i-lucide-refresh-cw animate-spin h-4 w-4 mr-2" />
          <div v-else class="i-lucide-search h-4 w-4 mr-2" />
          {{ loading ? '搜索中...' : '搜索集数' }}
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

      <!-- 搜索结果 -->
      <div class="flex flex-col gap-4" v-if="result">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-medium text-foreground">
            搜索结果 ({{ result.animes?.length || 0 }} 个动漫)
          </h4>
          <Badge variant="outline" class="text-xs">
            耗时: {{ responseTime }}ms
          </Badge>
        </div>

        <ScrollArea class="max-h-96 flex-1">
          <div v-if="result.animes && result.animes.length > 0" class="flex flex-col gap-4 pr-4">
            <Card v-for="anime in result.animes" :key="anime.animeId" class="hover:shadow-md transition-shadow">
              <CardContent class="p-4">
                <div class="flex items-center justify-between mb-3">
                  <h5 class="text-sm font-medium text-foreground">{{ anime.animeTitle }}</h5>
                  <div class="flex items-center gap-2">
                    <Badge variant="outline" class="text-xs">ID: {{ anime.animeId }}</Badge>
                    <Badge v-if="anime.type" variant="secondary" class="text-xs">{{ anime.type }}</Badge>
                  </div>
                </div>

                <div v-if="anime.typeDescription" class="text-xs text-muted-foreground mb-3">
                  {{ anime.typeDescription }}
                </div>

                <!-- 集数列表 -->
                <div v-if="anime.episodes && anime.episodes.length > 0" class="flex flex-col gap-2">
                  <h6 class="text-xs font-medium text-foreground">
                    集数列表 ({{ anime.episodes.length }} 集)
                  </h6>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <Card v-for="episode in anime.episodes" :key="episode.episodeId"
                      class="p-3 text-xs cursor-pointer hover:shadow-md transition-shadow"
                      @click="selectEpisode(episode)">
                      <div class="font-medium text-foreground">{{ episode.episodeTitle }}</div>
                      <div class="text-muted-foreground">ID: {{ episode.episodeId }}</div>
                    </Card>
                  </div>
                </div>

                <div v-else class="text-xs text-muted-foreground italic">
                  没有找到符合条件的集数
                </div>
              </CardContent>
            </Card>
          </div>

          <div v-else class="text-center py-8">
            <div class="i-lucide-file-x mx-auto h-12 w-12 text-muted-foreground/60" />
            <p class="mt-2 text-muted-foreground">没有找到相关动漫或集数</p>
          </div>
        </ScrollArea>
      </div>

      <!-- 选中的集数信息 -->
      <Card v-if="selectedEpisode" class="mt-4 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle class="text-sm text-blue-900">选中的集数</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-sm space-y-1">
            <div><strong>标题:</strong> {{ selectedEpisode.episodeTitle }}</div>
            <div><strong>集数ID:</strong> {{ selectedEpisode.episodeId }}</div>
          </div>
          <div class="mt-4 flex gap-2">
            <Button @click="copyEpisodeId" size="sm">
              复制集数ID
            </Button>
            <Button @click="selectedEpisode = null" variant="secondary" size="sm">
              清除选择
            </Button>
          </div>
        </CardContent>
      </Card>

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
