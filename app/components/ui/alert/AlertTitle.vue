<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils/cn'

interface IProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<IProps>()
</script>

<template>
  <h5 :class="cn('mb-1 font-medium leading-none tracking-tight', props.class)">
    <slot />
  </h5>
</template>
