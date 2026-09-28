<script setup lang="ts">
import type { AlertDialogEmits, AlertDialogProps } from 'reka-ui'
import { AlertDialogRoot, useForwardPropsEmits } from 'reka-ui'

type IProps = AlertDialogProps
type IEmits = AlertDialogEmits

const props = defineProps<IProps>()
const emits = defineEmits<IEmits>()

const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <AlertDialogRoot v-bind="forwarded">
    <slot />
  </AlertDialogRoot>
</template>
