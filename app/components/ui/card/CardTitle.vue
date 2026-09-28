<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils/cn'

interface IProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<IProps>()
</script>

<template>
  <h3 :class="cn('text-2xl font-semibold leading-none tracking-tight', props.class)">
    <slot />
  </h3>
</template>
