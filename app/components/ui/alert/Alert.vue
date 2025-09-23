<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import type { AlertVariants } from "./core"
import { cn } from "@/lib/utils"
import { alertVariants } from "./core"

const props = defineProps<{
  class?: HTMLAttributes["class"]
  variant?: AlertVariants["variant"]
}>()
</script>

<template>
  <div
    data-slot="alert"
    :class="cn(alertVariants({ variant }), props.class)"
    role="alert"
  >
    <slot />
  </div>
</template>
