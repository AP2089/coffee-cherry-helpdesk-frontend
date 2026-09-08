<template>
  <div v-if="!auth.ready" class="h-dvh bg-background" aria-hidden="true" />
  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const auth = useAuthStore()
</script>
