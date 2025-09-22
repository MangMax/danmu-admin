<template>
  <div>
    <slot />
    <Toaster />
  </div>
</template>

<script setup>
import { Toaster } from '@/components/ui/sonner'
</script>
