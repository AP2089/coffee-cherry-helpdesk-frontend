<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils/cn'

interface IProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<IProps>()
</script>

<template>
  <div :class="cn('border bg-card text-card-foreground shadow-sm', props.class)">
    <slot />
  </div>
</template>
