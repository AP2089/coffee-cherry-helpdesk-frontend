<script setup lang="ts">
interface IProps {
  tag?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<IProps>(), {
  tag: 'p',
  size: 'md',
})

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'text-xl'
  if (props.size === 'lg') return 'text-2xl md:text-3xl'
  return 'text-xl md:text-2xl'
})
</script>

<template>
  <component :is="tag" class="font-display font-bold tracking-tight" :class="sizeClass">
    coffee<span class="text-bronze"> cherry</span>
  </component>
</template>
