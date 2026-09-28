<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AlertVariants } from '.'
import { cn } from '@/utils/cn'
import { alertVariants } from '.'

interface IProps {
  class?: HTMLAttributes['class']
  variant?: AlertVariants['variant']
}

const props = defineProps<IProps>()
</script>

<template>
  <div :class="cn(alertVariants({ variant }), props.class)" role="alert">
    <slot />
  </div>
</template>
