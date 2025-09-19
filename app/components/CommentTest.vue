<template>
  <div class="comment-test">
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">💬 弹幕测试 (Comment API)</h3>
        <p class="card-subtitle">使用 commentId 获取弹幕数据</p>
      </div>

      <!-- 输入区域 -->
      <div class="input-section">
        <div class="input-group">
          <label for="commentId">CommentId (集数ID):</label>
          <input id="commentId" v-model="commentId" type="number" placeholder="输入 commentId，例如：10500"
            class="form-input" />
          <button @click="testComment" :disabled="!commentId || loading" class="btn btn-primary">
            <span v-if="loading">⏳</span>
            <span v-else>💬</span>
            获取弹幕
          </button>
        </div>
        <p class="help-text">
          💡 提示：commentId 可以从 "缓存数据详情" 中的集数列表获取
        </p>
      </div>

      <!-- 示例ID -->
      <div class="examples-section">
        <h4>🎯 快速测试 ID：</h4>
        <div class="example-ids">
          <button v-for="exampleId in exampleIds" :key="exampleId" @click="commentId = exampleId; testComment()"
            class="btn btn-example btn-sm">
            {{ exampleId }}
          </button>
        </div>
      </div>

      <!-- 结果显示区域 -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>正在获取弹幕数据...</p>
      </div>

      <div v-else-if="error" class="error-message">
        <h4>❌ 错误</h4>
        <pre>{{ error }}</pre>
        <button @click="clearResult" class="btn btn-secondary btn-sm">清除错误</button>
      </div>

      <div v-else-if="result" class="result-section">
        <div class="result-header">
          <h4>✅ 弹幕数据 (CommentId: {{ result.commentId }})</h4>
          <div class="result-actions">
            <button @click="clearResult" class="btn btn-secondary btn-sm">清除</button>
            <a :href="`/api/v2/comment/${result.commentId}`" target="_blank" class="btn btn-link btn-sm">
              🔗 API 链接
            </a>
          </div>
        </div>

        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">弹幕总数:</span>
            <span class="stat-value">{{ result.data.count || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">响应状态:</span>
            <span class="stat-value">{{ result.data.success ? '成功' : '失败' }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">数据来源:</span>
            <span class="stat-value">{{ result.data.source || '未知' }}</span>
          </div>
        </div>

        <!-- 弹幕样本 -->
        <div v-if="result.data.comments && result.data.comments.length > 0" class="comments-sample">
          <h5>📝 弹幕样本 (前10条):</h5>
          <div class="comments-list">
            <div v-for="(comment, index) in result.data.comments.slice(0, 10)" :key="index" class="comment-item">
              <span class="comment-time">{{ formatTime(comment.p) }}</span>
              <span class="comment-text">{{ comment.m }}</span>
            </div>
          </div>
          <p v-if="result.data.comments.length > 10" class="more-comments">
            还有 {{ result.data.comments.length - 10 }} 条弹幕...
          </p>
        </div>

        <!-- 原始数据 -->
        <details class="raw-data">
          <summary>🔍 查看原始响应数据</summary>
          <pre class="json-code">{{ JSON.stringify(result.data, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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

<style scoped>
.comment-test {
  margin-bottom: 2rem;
}

.card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  background: #f8fafc;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.card-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.card-subtitle {
  margin: 0;
  color: #718096;
  font-size: 0.875rem;
}

.input-section {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.input-group {
  display: flex;
  gap: 1rem;
  align-items: end;
  margin-bottom: 0.5rem;
}

.input-group label {
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 0.25rem;
  min-width: 120px;
}

.form-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d2d6dc;
  border-radius: 4px;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: #3182ce;
  box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
}

.help-text {
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  color: #718096;
}

.examples-section {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f7fafc;
}

.examples-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  color: #4a5568;
}

.example-ids {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #3182ce;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2c5aa0;
}

.btn-example {
  background: #e2e8f0;
  color: #4a5568;
  padding: 0.25rem 0.75rem;
}

.btn-example:hover {
  background: #cbd5e0;
}

.btn-secondary {
  background: #718096;
  color: white;
}

.btn-secondary:hover {
  background: #4a5568;
}

.btn-link {
  background: transparent;
  color: #3182ce;
  border: 1px solid #3182ce;
}

.btn-link:hover {
  background: #3182ce;
  color: white;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.loading {
  padding: 2rem;
  text-align: center;
  color: #718096;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  padding: 1.5rem;
  background: #fed7d7;
  color: #742a2a;
}

.error-message h4 {
  margin: 0 0 1rem 0;
}

.error-message pre {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.75rem;
  margin: 0 0 1rem 0;
}

.result-section {
  padding: 1.5rem;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h4 {
  margin: 0;
  color: #22543d;
}

.result-actions {
  display: flex;
  gap: 0.5rem;
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f0fff4;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #718096;
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #22543d;
}

.comments-sample {
  margin-bottom: 1.5rem;
}

.comments-sample h5 {
  margin: 0 0 1rem 0;
  color: #4a5568;
}

.comments-list {
  background: #f7fafc;
  border-radius: 4px;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.comment-item {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-time {
  font-size: 0.75rem;
  color: #718096;
  min-width: 50px;
  font-family: monospace;
}

.comment-text {
  flex: 1;
  font-size: 0.875rem;
  color: #4a5568;
}

.more-comments {
  margin: 0.5rem 0 0 0;
  font-size: 0.875rem;
  color: #718096;
  text-align: center;
}

.raw-data {
  margin-top: 1.5rem;
}

.raw-data summary {
  cursor: pointer;
  font-weight: 500;
  color: #4a5568;
  padding: 0.5rem 0;
}

.json-code {
  background: #1a202c;
  color: #e2e8f0;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.75rem;
  margin: 0.5rem 0 0 0;
}
</style>