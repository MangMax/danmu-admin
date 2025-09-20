<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  height?: string
  stickyHeader?: boolean
}>()
</script>

<template>
  <div data-slot="table-container" :class="cn(
    'relative w-full',
    props.stickyHeader ? 'overflow-hidden' : 'overflow-auto'
  )">
    <ScrollArea v-if="props.stickyHeader" :class="cn('w-full', props.height ? '' : 'h-96')"
      :style="props.height ? `height: ${props.height}` : ''">
      <table data-slot="table" :class="cn('w-full caption-bottom text-sm', props.class)">
        <slot />
      </table>
    </ScrollArea>
    <table v-else data-slot="table" :class="cn('w-full caption-bottom text-sm', props.class)">
      <slot />
    </table>
  </div>
</template>
