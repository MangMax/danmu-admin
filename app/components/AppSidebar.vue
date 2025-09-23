<script setup lang="ts">
import type { SidebarProps } from "~/components/ui/sidebar/core"

import {
  GalleryVerticalEnd,
  SquareTerminal,
  Activity,
  FileClock,
} from "lucide-vue-next"

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})

const { user } = useUserSession()
const { data: config } = await useFetch('/api/config')

const data = computed(() => ({
  user: {
    name: user.value?.username || "",
    avatar: "",
  },
  teams: [
    {
      name: "Logvar-Danmu",
      logo: GalleryVerticalEnd,
      plan: `v${config.value?.version}`,
    },
  ],
  navMain: [
    {
      title: "系统概览",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: "接口测试",
      url: "/api-test",
      icon: Activity,
      isActive: false,
    },
    {
      title: "系统日志",
      url: "/logs",
      icon: FileClock,
      isActive: false,
    },
  ],
  projects: [
  ],
}))
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <TeamSwitcher :teams="data.teams" />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="data.navMain" />
      <NavProjects v-if="data.projects.length > 0" :projects="data.projects" />
    </SidebarContent>
    <SidebarFooter v-if="config?.passwordAuth === 'enabled'">
      <NavUser :user="data.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
