<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  sticky?: boolean
}>()
</script>

<template>
  <thead data-slot="table-header" :class="cn(
    '[&_tr]:border-b',
    props.sticky && 'sticky top-0 z-10 bg-background shadow-sm',
    props.class
  )">
    <slot />
  </thead>
</template>
