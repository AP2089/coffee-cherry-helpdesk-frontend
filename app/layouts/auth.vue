<template>
  <div class="relative h-dvh w-full overflow-hidden bg-background text-foreground">
    <div class="flex h-full w-full items-center justify-center px-4">
      <slot />
    </div>
    <ClientOnly>
      <Toaster />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Toaster } from '~/components/ui/toast'
</script>
