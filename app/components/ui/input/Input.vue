<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/utils/cn'

interface IProps {
  defaultValue?: string | number
  modelValue?: string | number
  class?: HTMLAttributes['class']
}

interface IEmits {
  'update:modelValue': [payload: string | number]
}

const props = defineProps<IProps>()
const emits = defineEmits<IEmits>()

const modelValue = useVModel(props, 'modelValue', emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <input
    v-model="modelValue"
    :class="
      cn(
        'flex h-auto w-full border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
