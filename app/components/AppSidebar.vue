<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"

import {
  GalleryVerticalEnd,
  SquareTerminal,
  Activity,
  FileClock,
} from "lucide-vue-next"
import NavMain from "@/components/NavMain.vue"
import NavProjects from "./NavProjects.vue"
import NavUser from "@/components/NavUser.vue"
import TeamSwitcher from "@/components/TeamSwitcher.vue"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})

const { user } = useUserSession()

const data = {
  user: {
    name: user.value?.username || "",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Varlog-Danmu",
      logo: GalleryVerticalEnd,
      plan: "v1.0.0",
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
}
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
    <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
