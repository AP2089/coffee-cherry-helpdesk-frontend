<template>
  <header
    class="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3 md:gap-4 md:px-6"
  >
    <div class="min-w-0">
      <BrandLogo size="sm" />
      <p class="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">Helpdesk</p>
    </div>

    <div class="flex shrink-0 items-center gap-2 sm:gap-3">
      <div class="flex items-end gap-2 sm:gap-3">
        <slot name="actions" />
        <div class="hidden text-right sm:block">
          <p class="text-sm leading-5">{{ auth.user?.username }}</p>
          <p class="text-xs leading-4 text-muted-foreground">{{ roleLabel }}</p>
        </div>
      </div>
      <Button variant="outline" size="sm" @click="emit('logout')">Выйти</Button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { UserRole } from '~/types/chat'

const emit = defineEmits<{
  logout: []
}>()

const auth = useAuthStore()

const roleLabel = computed(() => {
  if (auth.user?.role === UserRole.Admin) return 'Администратор'
  if (auth.isGuest) return 'Гость'
  if (auth.user?.role === UserRole.Manager) return 'Менеджер'
  return 'Оператор'
})
</script>
