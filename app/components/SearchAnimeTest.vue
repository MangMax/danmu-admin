<template>
  <Card>
    <CardContent class="flex flex-col">
      <CardHeader class="px-0 pt-0">
        <div class="flex items-center justify-between">
          <CardTitle class="text-lg">搜索动漫</CardTitle>
          <Badge variant="secondary" class="text-xs">
            GET /api/v2/search/anime
          </Badge>
        </div>
      </CardHeader>

      <!-- 输入表单 -->
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col gap-2">
          <Label for="keyword">
            关键词 <span class="text-destructive">*</span>
          </Label>
          <Input id="keyword" v-model="form.keyword" type="text" placeholder="请输入动漫名称，如：进击的巨人"
            @keyup.enter="searchAnime" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <Label for="providers">提供商</Label>
            <Input id="providers" v-model="form.providers" type="text" placeholder="如：360kan,renren（可选）" />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="maxResults">最大结果数</Label>
            <Input id="maxResults" v-model.number="form.maxResults" type="number" placeholder="默认：10" min="1"
              max="50" />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="season">季度</Label>
            <Input id="season" v-model.number="form.season" type="number" placeholder="如：2023（可选）" min="2000"
              max="2030" />
          </div>
        </div>

        <Button @click="searchAnime" :disabled="loading || !form.keyword.trim()" class="w-full">
          <div v-if="loading" class="i-lucide-refresh-cw animate-spin h-4 w-4 mr-2" />
          <div v-else class="i-lucide-search h-4 w-4 mr-2" />
          {{ loading ? '搜索中...' : '搜索动漫' }}
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
            搜索结果 ({{ result.animes?.length || 0 }} 个)
          </h4>
          <Badge variant="outline" class="text-xs">
            耗时: {{ responseTime }}ms
          </Badge>
        </div>

        <ScrollArea class="max-h-96 flex-1">
          <div v-if="result.animes && result.animes.length > 0" class="flex flex-col gap-3 pr-4">
            <Card v-for="anime in result.animes" :key="anime.animeId" class="hover:shadow-md transition-shadow">
              <CardContent class="p-4">
                <div class="flex items-start gap-4">
                  <img v-if="anime.imageUrl" :src="anime.imageUrl" :alt="anime.animeTitle"
                    class="w-16 h-20 object-cover rounded-md flex-shrink-0"
                    @error="$event.target.style.display = 'none'" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <h5 class="text-sm font-medium text-foreground truncate">{{ anime.animeTitle }}</h5>
                      <Badge variant="outline" class="text-xs">ID: {{ anime.animeId }}</Badge>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <Badge v-if="anime.type" variant="secondary" class="text-xs">{{ anime.type }}</Badge>
                      <Badge v-if="anime.episodeCount" variant="secondary" class="text-xs">{{ anime.episodeCount }}集
                      </Badge>
                      <Badge v-if="anime.rating" variant="secondary" class="text-xs">⭐ {{ anime.rating }}</Badge>
                    </div>
                    <p v-if="anime.typeDescription" class="mt-2 text-xs text-muted-foreground">{{ anime.typeDescription
                    }}
                    </p>

                    <!-- 播放链接 -->
                    <Collapsible v-if="anime.playlinks && anime.playlinks.length > 0" class="mt-3">
                      <CollapsibleTrigger class="flex items-center text-xs text-primary hover:text-primary/80">
                        <div class="i-lucide-chevron-right h-3 w-3 mr-1" />
                        查看播放链接 ({{ anime.playlinks.length }} 个)
                      </CollapsibleTrigger>
                      <CollapsibleContent class="mt-2 pl-4 border-l-2 border-border">
                        <div class="flex flex-col gap-1">
                          <div v-for="(link, index) in anime.playlinks.slice(0, 5)" :key="index" class="text-xs">
                            <span class="font-medium text-foreground">{{ link.name }}:</span>
                            <code class="ml-1 text-muted-foreground bg-muted px-1 rounded">{{ link.url }}</code>
                          </div>
                          <div v-if="anime.playlinks.length > 5" class="text-xs text-muted-foreground">
                            ... 还有 {{ anime.playlinks.length - 5 }} 个链接
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div v-else class="text-center py-8">
            <div class="i-lucide-file-x mx-auto h-12 w-12 text-muted-foreground/60" />
            <p class="mt-2 text-muted-foreground">没有找到相关动漫</p>
          </div>
        </ScrollArea>
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
import { ref, reactive } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

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
