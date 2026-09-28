<script setup lang="ts">
import type { AlertDialogActionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogAction } from 'reka-ui'
import { cn } from '@/utils/cn'
import { buttonVariants } from '@/components/ui/button'

interface IProps extends AlertDialogActionProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<IProps>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AlertDialogAction
    v-bind="delegatedProps"
    :class="cn(buttonVariants({ variant: 'destructive-outline', size: 'sm' }), props.class)"
  >
    <slot />
  </AlertDialogAction>
</template>
