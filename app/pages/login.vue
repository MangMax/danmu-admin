<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
    <Card class="w-full max-w-md">
      <CardHeader class="flex flex-col gap-1 items-center text-center">
        <CardTitle class="text-2xl font-bold tracking-tight">
          弹幕管理系统
        </CardTitle>
        <CardDescription>
          请输入您的用户名和密码登录
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
          <div class="flex flex-col gap-2">
            <Label for="username">用户名</Label>
            <Input id="username" v-model="form.username" type="text" placeholder="请输入用户名" required :disabled="loading"
              @input="clearError" />
          </div>

          <div class="flex flex-col gap-2">
            <Label for="password">密码</Label>
            <div class="relative">
              <Input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码" required :disabled="loading" class="pr-10" @input="clearError" />
              <Button type="button" variant="ghost" size="sm"
                class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" @click="togglePasswordVisibility"
                :disabled="loading">
                <component :is="showPassword ? EyeOffIcon : EyeIcon" class="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <Alert v-if="error" variant="destructive" class="mt-4">
            <AlertCircleIcon class="h-4 w-4" />
            <AlertTitle>登录失败</AlertTitle>
            <AlertDescription>
              {{ error }}
            </AlertDescription>
          </Alert>

          <Button type="submit" class="w-full mt-6" :disabled="loading || !form.username || !form.password">
            <Loader2Icon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ loading ? '登录中...' : '登录' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, EyeOffIcon, AlertCircleIcon, Loader2Icon } from 'lucide-vue-next'

// 页面元信息
definePageMeta({
  layout: 'auth',
  auth: false // 登录页面不需要认证
})

const router = useRouter()

// 表单数据
const form = ref({
  username: '',
  password: ''
})

// 状态
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const { loggedIn, fetch: fetchUserSession } = useUserSession()

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// 清除错误信息
const clearError = () => {
  if (error.value) {
    error.value = ''
  }
}

// 检查是否已经登录
onMounted(async () => {
  if (loggedIn.value) {
    // 已经登录，重定向到首页
    await router.push('/')
  }
})

// 处理登录
const handleLogin = async () => {
  if (loading.value) return

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<{
      success: boolean;
      message: string;
      user?: {
        username: string;
        loginTime: string;
      };
    }>('/api/auth/login', {
      method: 'POST',
      body: {
        username: form.value.username,
        password: form.value.password
      }
    })

    if (response.success) {
      console.log('Login successful')
      await fetchUserSession()
      // 登录成功，重定向到首页
      await router.push('/')
    } else {
      error.value = response.message || '登录失败'
    }
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err?.statusMessage || err?.message || '登录失败，请检查用户名和密码'
  } finally {
    loading.value = false
  }
}
</script>
