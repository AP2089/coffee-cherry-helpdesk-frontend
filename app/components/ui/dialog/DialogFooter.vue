<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils/cn'

interface IProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<IProps>()
</script>

<template>
  <div :class="cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-x-2', props.class)">
    <slot />
  </div>
</template>
