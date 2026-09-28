<script setup lang="ts">
import { Toaster } from '~/components/ui/toast'
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
    <slot />
    <ClientOnly>
      <Toaster />
    </ClientOnly>
  </div>
</template>
