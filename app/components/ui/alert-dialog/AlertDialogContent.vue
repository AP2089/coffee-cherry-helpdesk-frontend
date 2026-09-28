<script setup lang="ts">
import type { AlertDialogContentEmits, AlertDialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/utils/cn'

interface IProps extends AlertDialogContentProps {
  class?: HTMLAttributes['class']
}

type IEmits = AlertDialogContentEmits

const props = defineProps<IProps>()
const emits = defineEmits<IEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <AlertDialogPortal>
    <AlertDialogOverlay
      class="alert-dialog-overlay fixed inset-0 z-50 bg-background/75 backdrop-blur-sm"
    />
    <AlertDialogContent
      v-bind="forwarded"
      :class="
        cn(
          'alert-dialog-content fixed left-1/2 top-1/2 z-50 grid w-full max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 border border-border bg-background p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)]',
          props.class,
        )
      "
    >
      <slot />
    </AlertDialogContent>
  </AlertDialogPortal>
</template>
