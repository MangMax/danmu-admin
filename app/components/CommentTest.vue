<template>
  <Card>
    <CardContent class="flex flex-col">
      <CardHeader class="px-0 pt-0">
        <div class="flex items-center justify-between">
          <div>
            <CardTitle class="flex items-center gap-2">
              <div class="i-lucide-message-circle h-5 w-5" />
              弹幕测试 (Comment API)
            </CardTitle>
            <p class="text-sm text-muted-foreground mt-1">使用 commentId 获取弹幕数据</p>
          </div>
          <Badge variant="secondary" class="text-xs">
            GET /api/v2/comment/[id]
          </Badge>
        </div>
      </CardHeader>

      <!-- 输入区域 -->
      <div class="flex flex-col gap-4 mb-6">
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <Label for="commentId">CommentId (集数ID)</Label>
            <Input id="commentId" v-model.number="commentId" type="number" placeholder="输入 commentId，例如：10500"
              class="mt-1" />
          </div>
          <Button @click="testComment" :disabled="!commentId || loading">
            <div v-if="loading" class="i-lucide-refresh-cw animate-spin h-4 w-4 mr-2" />
            <div v-else class="i-lucide-message-circle h-4 w-4 mr-2" />
            获取弹幕
          </Button>
        </div>
        <p class="text-xs text-muted-foreground">
          💡 提示：commentId 可以从 “缓存数据详情” 中的集数列表获取
        </p>
      </div>

      <!-- 示例ID -->
      <div class="flex flex-col gap-2 mb-6">
        <h4 class="text-sm font-medium flex items-center gap-2">
          <div class="i-lucide-target h-4 w-4" />
          快速测试 ID
        </h4>
        <div class="flex flex-wrap gap-2">
          <Button v-for="exampleId in exampleIds" :key="exampleId" @click="commentId = exampleId; testComment()"
            variant="outline" size="sm">
            {{ exampleId }}
          </Button>
        </div>
      </div>

      <!-- 结果显示区域 -->
      <div v-if="loading" class="text-center py-8">
        <div class="i-lucide-refresh-cw animate-spin h-8 w-8 mx-auto text-primary" />
        <p class="mt-2 text-muted-foreground">正在获取弹幕数据...</p>
      </div>

      <div v-else-if="error" class="rounded-md bg-destructive/15 border border-destructive/20 p-4">
        <div class="flex items-start gap-3">
          <div class="i-lucide-alert-circle h-5 w-5 text-destructive mt-0.5" />
          <div class="flex-1">
            <h4 class="text-sm font-medium text-destructive mb-2">错误</h4>
            <ScrollArea class="max-h-32">
              <pre
                class="text-xs text-destructive bg-destructive/10 p-2 rounded">{{ JSON.stringify(error, null, 2) }}</pre>
            </ScrollArea>
            <Button @click="clearResult" variant="outline" size="sm" class="mt-2">清除错误</Button>
          </div>
        </div>
      </div>

      <div v-else-if="result" class="rounded-lg bg-green-50 border border-green-200 p-4">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-green-900 flex items-center gap-2 text-lg font-medium">
            <div class="i-lucide-check-circle h-5 w-5" />
            弹幕数据 (CommentId: {{ result.commentId }})
          </h4>
          <div class="flex gap-2">
            <Button @click="clearResult" variant="secondary" size="sm">清除</Button>
            <Button asChild variant="outline" size="sm">
              <a :href="`/api/v2/comment/${result.commentId}`" target="_blank">
                <div class="i-lucide-external-link h-3 w-3 mr-1" />
                API 链接
              </a>
            </Button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="text-center bg-white rounded-lg border p-4">
            <div class="text-2xl font-bold text-green-600">{{ result.data.count || 0 }}</div>
            <div class="text-sm text-muted-foreground">弹幕总数</div>
          </div>
          <div class="text-center bg-white rounded-lg border p-4">
            <Badge :variant="result.data.success ? 'default' : 'destructive'" class="text-sm">
              {{ result.data.success ? '成功' : '失败' }}
            </Badge>
            <div class="text-sm text-muted-foreground mt-1">响应状态</div>
          </div>
          <div class="text-center bg-white rounded-lg border p-4">
            <div class="text-sm font-medium text-foreground">{{ result.data.source || '未知' }}</div>
            <div class="text-sm text-muted-foreground">数据来源</div>
          </div>
        </div>

        <!-- 弹幕样本 -->
        <div v-if="result.data.comments && result.data.comments.length > 0">
          <h5 class="text-lg font-medium mb-3 flex items-center gap-2">
            <div class="i-lucide-message-square h-5 w-5" />
            弹幕样本 (前10条)
          </h5>
          <div class="bg-white rounded-lg border">
            <ScrollArea class="h-64">
              <div class="divide-y">
                <div v-for="(comment, index) in result.data.comments.slice(0, 10)" :key="index"
                  class="flex gap-4 p-3 hover:bg-muted/50">
                  <Badge variant="outline" class="text-xs font-mono min-w-fit">{{ formatTime(comment.p) }}</Badge>
                  <span class="text-sm text-foreground flex-1">{{ comment.m }}</span>
                </div>
              </div>
            </ScrollArea>
          </div>
          <p v-if="result.data.comments.length > 10" class="text-sm text-muted-foreground text-center mt-2">
            还有 {{ result.data.comments.length - 10 }} 条弹幕...
          </p>
        </div>

        <!-- 原始数据 -->
        <Collapsible class="mt-4">
          <CollapsibleTrigger class="flex items-center text-sm text-muted-foreground hover:text-foreground">
            <div class="i-lucide-chevron-right h-4 w-4 mr-1" />
            查看原始响应数据
          </CollapsibleTrigger>
          <CollapsibleContent class="mt-2">
            <ScrollArea class="h-40">
              <pre class="p-3 bg-muted rounded-md text-xs">{{ JSON.stringify(result.data, null, 2) }}</pre>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
import { ref } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

const commentId = ref('')
const loading = ref(false)
const result = ref(null)
const error = ref(null)

// 示例ID（从之前的海贼王集数中选取）
const exampleIds = [10500, 10600, 10700, 10800, 10900, 11000]

const testComment = async () => {
  if (!commentId.value) return

  loading.value = true
  error.value = null
  result.value = null

  try {
    const response = await $fetch(`/api/v2/comment/${commentId.value}`)
    result.value = {
      commentId: commentId.value,
      data: response
    }
  } catch (err) {
    error.value = {
      message: err.message,
      statusCode: err.statusCode,
      url: `/api/v2/comment/${commentId.value}`
    }
  } finally {
    loading.value = false
  }
}

const clearResult = () => {
  result.value = null
  error.value = null
}

const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A'
  const time = parseFloat(timeStr.split(',')[0])
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
</script>
