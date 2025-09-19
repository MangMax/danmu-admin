<template>
  <div class="cache-details">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">📁 缓存数据详情</h3>
        <div class="header-actions">
          <button @click="addSampleData" :disabled="addingData" class="btn btn-success btn-sm">
            <span v-if="addingData">⏳</span>
            <span v-else>🧪</span>
            添加测试数据
          </button>
          <button @click="refreshData" :disabled="refreshing" class="btn btn-primary btn-sm">
            <span v-if="refreshing">🔄</span>
            <span v-else>🔄</span>
            刷新
          </button>
        </div>
      </div>

      <div v-if="pending" class="loading">
        <div class="loading-spinner"></div>
        <p>加载缓存数据中...</p>
      </div>

      <div v-else-if="error" class="error">
        <p>❌ 加载失败: {{ error }}</p>
        <button @click="refreshData" class="btn btn-secondary btn-sm">重试</button>
      </div>

      <div v-else-if="data" class="cache-content">
        <!-- 统计概览 -->
        <div class="stats-overview">
          <div class="stat-item">
            <div class="stat-value">{{ stats.animeCount || 0 }}</div>
            <div class="stat-label">番剧数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.episodeCount || 0 }}</div>
            <div class="stat-label">集数记录</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalItems || 0 }}</div>
            <div class="stat-label">总缓存项</div>
          </div>
        </div>

        <!-- 番剧列表 -->
        <div class="section">
          <h4 class="section-title">
            🎬 番剧列表 ({{ animes.length }})
            <span v-if="animes.length === 0" class="empty-hint">
              - 暂无数据，请先使用搜索功能
            </span>
          </h4>

          <div v-if="animes.length > 0" class="anime-list">
            <div v-for="anime in animes" :key="anime.animeId" class="anime-item">
              <div class="anime-info">
                <div class="anime-title">
                  {{ anime.animeTitle }}
                  <span class="anime-id">#{{ anime.animeId }}</span>
                </div>
                <div class="anime-meta">
                  <span class="anime-type">{{ anime.type || '未知类型' }}</span>
                  <span class="anime-episodes">{{ anime.episodeCount || 1 }}集</span>
                  <span v-if="anime.rating" class="anime-rating">⭐ {{ anime.rating }}</span>
                </div>
              </div>
              <div class="anime-actions">
                <button @click="testAnime(anime.animeId)" class="btn btn-test btn-xs" title="测试番剧API">
                  🧪 测试
                </button>
                <a :href="`/api/v2/bangumi/${anime.animeId}`" target="_blank" class="btn btn-link btn-xs"
                  title="查看API响应">
                  🔗 API
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- 集数数据 -->
        <div class="section">
          <h4 class="section-title">
            📺 集数数据 ({{ episodes.length }}) - commentId弹幕ID
          </h4>

          <div v-if="episodes.length > 0" class="episodes-list">
            <div v-for="episode in episodes.slice(0, 10)" :key="episode.id" class="episode-item">
              <div class="episode-id">
                <strong>ID: {{ episode.id }}</strong>
                <span class="comment-hint">(commentId)</span>
              </div>
              <div class="episode-title">{{ episode.title || `Episode ${episode.id}` }}</div>
              <div class="episode-url">{{ truncateUrl(episode.url) }}</div>
              <div class="episode-actions">
                <a :href="`/api/v2/comment/${episode.id}`" target="_blank" class="btn btn-comment btn-sm">
                  💬 获取弹幕
                </a>
                <button @click="testComment(episode.id)" class="btn btn-test btn-sm">
                  🧪 测试弹幕
                </button>
              </div>
            </div>
            <div v-if="episodes.length > 10" class="more-episodes">
              还有 {{ episodes.length - 10 }} 条记录...
              <button @click="showAllEpisodes = !showAllEpisodes" class="btn btn-secondary btn-sm">
                {{ showAllEpisodes ? '收起' : '显示全部' }}
              </button>
            </div>
          </div>

          <div v-else class="empty-episodes">
            暂无集数数据
          </div>
        </div>

        <!-- 测试结果 -->
        <div v-if="testResult" class="test-result">
          <h4 class="section-title">🧪 测试结果</h4>
          <div :class="['test-output', testResult.success ? 'success' : 'error']">
            <pre>{{ JSON.stringify(testResult.data, null, 2) }}</pre>
          </div>
        </div>

        <!-- 更新时间 -->
        <div class="update-time">
          最后更新: {{ formatTime(data.timestamp) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

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
    } else {
      testResult.value = {
        success: false,
        type: 'sample-data',
        data: response
      }
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

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.card-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.btn {
  padding: 0.375rem 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #218838;
}

.btn-test {
  background: #28a745;
  color: white;
}

.btn-link {
  background: #17a2b8;
  color: white;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.btn-xs {
  padding: 0.125rem 0.375rem;
  font-size: 0.625rem;
}

.loading,
.error {
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.cache-content {
  padding: 1.5rem;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-item {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.empty-hint {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: normal;
}

.anime-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.anime-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  background: #fafafa;
}

.anime-info {
  flex: 1;
}

.anime-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.anime-id {
  color: #6c757d;
  font-size: 0.875rem;
  font-weight: normal;
}

.anime-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.anime-actions {
  display: flex;
  gap: 0.5rem;
}

.episodes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.episode-item {
  display: grid;
  grid-template-columns: 100px 1fr 150px;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #fafafa;
  font-size: 0.875rem;
}

.episode-id {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #007bff;
}

.comment-hint {
  font-size: 12px;
  color: #6c757d;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: normal;
}

.episode-title {
  color: #343a40;
  font-weight: 500;
  margin: 4px 0;
}

.episode-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.btn-comment {
  background: #28a745;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  text-decoration: none;
  font-size: 12px;
}

.btn-comment:hover {
  background: #218838;
}

.episode-url {
  color: #6c757d;
  word-break: break-all;
}

.episode-time {
  color: #6c757d;
  text-align: right;
}

.more-episodes {
  padding: 0.5rem;
  text-align: center;
  color: #6c757d;
  font-size: 0.875rem;
}

.empty-episodes {
  padding: 1rem;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

.test-result {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.test-output {
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}

.test-output.success {
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.test-output.error {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.test-output pre {
  margin: 0;
  font-size: 0.875rem;
}

.update-time {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
  text-align: center;
  font-size: 0.875rem;
  color: #6c757d;
}
</style>
