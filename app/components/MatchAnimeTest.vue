<template>
  <Card>
    <CardContent class="flex flex-col">
      <CardHeader class="px-0 pt-0">
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg">匹配动漫</CardTitle>
          <Badge variant="secondary" class="text-xs">
            POST /api/v2/match
          </Badge>
        </div>
      </CardHeader>

      <!-- 输入表单 -->
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col gap-2">
          <Label for="fileName">
            文件名 <span class="text-destructive">*</span>
          </Label>
          <Input id="fileName" v-model="form.fileName" type="text" placeholder="如：进击的巨人 S01E01 或 鬼灭之刃 第1集"
            @keyup.enter="matchAnime" />
          <p class="mt-1 text-xs text-gray-500">
            支持格式：动漫名称 S01E01、动漫名称 第1集、动漫名称.mkv 等
          </p>
        </div>

        <!-- 常用示例 -->
        <div class="flex flex-col gap-2">
          <Label class="text-sm font-medium">常用示例</Label>
          <div class="flex flex-wrap gap-2">
            <Button v-for="example in examples" :key="example" @click="form.fileName = example" type="button"
              variant="outline" size="sm" class="text-xs">
              {{ example }}
            </Button>
          </div>
        </div>

        <Button @click="matchAnime" :disabled="loading || !form.fileName.trim()"
          class="w-full bg-purple-600 hover:bg-purple-700">
          <div v-if="loading" class="i-lucide-refresh-cw animate-spin h-4 w-4 mr-2" />
          <div v-else class="i-lucide-search h-4 w-4 mr-2" />
          {{ loading ? '匹配中...' : '匹配动漫' }}
        </Button>
      </div>

      <!-- 文件名解析结果 -->
      <Card v-if="parsedInfo" class="mb-4 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle class="text-sm text-blue-900">文件名解析结果</CardTitle>
        </CardHeader>
        <CardContent>
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

        </CardContent>
      </Card>

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

      <!-- 匹配结果 -->
      <div v-if="result">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-medium text-foreground">匹配结果</h4>
          <div class="flex items-center gap-3">
            <Badge :variant="result.isMatched ? 'default' : 'destructive'">
              {{ result.isMatched ? '匹配成功' : '未找到匹配' }}
            </Badge>
            <Badge variant="outline" class="text-xs">耗时: {{ responseTime }}ms</Badge>
          </div>
        </div>

        <!-- 匹配的动漫信息 -->
        <div v-if="result.isMatched && result.matches && result.matches.length > 0" class="flex flex-col gap-4">
          <Card v-for="match in result.matches" :key="match.episodeId" class="bg-green-50 border-green-200">
            <CardContent class="p-4">
              <div class="flex items-start gap-4">
                <img v-if="match.imageUrl" :src="match.imageUrl" :alt="match.animeTitle"
                  class="w-16 h-20 object-cover rounded-md flex-shrink-0"
                  @error="$event.target.style.display = 'none'" />
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
                  <div class="mt-3 flex gap-2">
                    <Button @click="copyEpisodeId(match.episodeId)" size="sm" class="bg-green-600 hover:bg-green-700">
                      复制集数ID
                    </Button>
                    <Button @click="copyAnimeId(match.animeId)" size="sm" variant="secondary">
                      复制动漫ID
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- 未匹配提示 -->
        <div v-else class="text-center py-8">
          <div class="i-lucide-file-x mx-auto h-12 w-12 text-muted-foreground/60" />
          <p class="mt-2 text-muted-foreground">没有找到匹配的动漫</p>
          <p class="mt-1 text-sm text-muted-foreground">请尝试调整文件名格式或检查动漫名称是否正确</p>
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
