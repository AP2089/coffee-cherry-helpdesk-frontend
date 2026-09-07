<template>
  <div
    class="fixed inset-0 z-10 flex items-center justify-center overflow-hidden bg-background px-4 text-foreground"
  >
    <slot />
    <ClientOnly>
      <Toaster />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Toaster } from '~/components/ui/toast'
</script>
