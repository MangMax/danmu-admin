<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { BadgeVariants } from "./core"
import { reactiveOmit } from "@vueuse/core"
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { badgeVariants } from "./core"

const props = defineProps<PrimitiveProps & {
  variant?: BadgeVariants["variant"]
  class?: HTMLAttributes["class"]
}>()

const delegatedProps = reactiveOmit(props, "class")
</script>

<template>
  <Primitive
    data-slot="badge"
    :class="cn(badgeVariants({ variant }), props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </Primitive>
</template>
