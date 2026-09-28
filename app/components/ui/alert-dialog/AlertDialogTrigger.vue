<script setup lang="ts">
import type { AlertDialogTriggerProps } from 'reka-ui'
import { AlertDialogTrigger } from 'reka-ui'

type IProps = AlertDialogTriggerProps

const props = defineProps<IProps>()
</script>

<template>
  <AlertDialogTrigger v-bind="props">
    <slot />
  </AlertDialogTrigger>
</template>
