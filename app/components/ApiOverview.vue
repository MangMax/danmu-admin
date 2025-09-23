<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle>API概览</CardTitle>
        <Button @click="refreshOverview" :disabled="loading" variant="outline" size="sm">
          <div v-if="loading" class="i-lucide-refresh-cw h-4 w-4 mr-2 animate-spin" />
          <div v-else class="i-lucide-refresh-cw h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>
    </CardHeader>
    <CardContent>

      <div v-if="error" class="mb-4 p-4 bg-destructive/15 border-l-4 border-destructive rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <div class="i-lucide-alert-circle h-5 w-5 text-destructive" />
          </div>
          <div class="ml-3">
            <p class="text-sm text-destructive">{{ error }}</p>
          </div>
        </div>
      </div>

      <div v-if="overview" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 服务状态 -->
        <Card class="bg-green-50 border-green-200">
          <CardContent class="p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="i-lucide-check-circle h-8 w-8 text-green-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-green-900">服务状态</p>
                <p class="text-2xl font-semibold text-green-600">正常</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 版本信息 -->
        <Card class="bg-blue-50 border-blue-200">
          <CardContent class="p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="i-lucide-zap h-8 w-8 text-blue-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-blue-900">版本</p>
                <p class="text-2xl font-semibold text-blue-600">{{ overview.version }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 动漫数据 -->
        <Card class="bg-purple-50 border-purple-200">
          <CardContent class="p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="i-lucide-database h-8 w-8 text-purple-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-purple-900">动漫数据</p>
                <p class="text-2xl font-semibold text-purple-600">{{ overview.stats?.anime?.count || 0 }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 集数数据 -->
        <Card class="bg-orange-50 border-orange-200">
          <CardContent class="p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="i-lucide-film h-8 w-8 text-orange-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-orange-900">集数数据</p>
                <p class="text-2xl font-semibold text-orange-600">{{ overview.stats?.episodes?.count || 0 }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- API端点列表 -->
      <div v-if="overview" class="mt-6">
        <h3 class="text-lg font-medium text-foreground mb-3">可用端点</h3>
        <Card class="bg-muted/30">
          <CardContent class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div v-for="(endpoint, key) in overview.endpoints" :key="key" class="flex items-center">
                <div class="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <code
                  class="text-muted-foreground">{{ typeof endpoint === 'string' ? endpoint : JSON.stringify(endpoint) }}</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 支持的平台 -->
      <div v-if="overview?.supportedPlatforms" class="mt-6">
        <h3 class="text-lg font-medium text-foreground mb-3">支持的平台</h3>
        <div class="flex flex-wrap gap-2">
          <Badge v-for="platform in overview.supportedPlatforms" :key="platform" variant="secondary">
            {{ platform }}
          </Badge>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup>
const overview = ref(null)
const loading = ref(false)
const error = ref('')

const fetchOverview = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await $fetch('/api')
    if (response.success) {
      overview.value = response.data
    } else {
      error.value = response.errorMessage || '获取API概览失败'
    }
  } catch (err) {
    error.value = `请求失败: ${err.message || err}`
  } finally {
    loading.value = false
  }
}

const refreshOverview = () => {
  fetchOverview()
}

onMounted(() => {
  fetchOverview()
})
</script>
