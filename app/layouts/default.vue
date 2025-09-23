<template>
  <div class="min-h-screen bg-background">
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header
          class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div class="flex items-center gap-2 px-4">
            <SidebarTrigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 h-4" />
          </div>
        </header>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
          <slot />
        </div>
      </SidebarInset>
    </SidebarProvider>
    <Sonner />
  </div>
</template>

<script setup>
// 配置状态
const config = ref(null)
const passwordAuthEnabled = ref(false)

// 检查认证状态
onMounted(async () => {
  await fetchConfig()
})

// 获取配置信息
const fetchConfig = async () => {
  try {
    const response = await $fetch('/api/config')
    config.value = response
    passwordAuthEnabled.value = response.passwordAuth === 'enabled'
  } catch (error) {
    console.error('Failed to fetch config:', error)
  }
}
</script>
