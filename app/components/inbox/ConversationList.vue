<template>
  <aside class="flex h-full min-h-0 flex-col overflow-hidden border-b border-border md:border-b-0">
    <div
      ref="listEl"
      class="inbox-list min-h-0 flex-1 overflow-y-auto"
      @scroll="listScroll.onScroll"
    >
      <p v-if="loading" class="px-4 py-6 text-sm text-muted-foreground">Загрузка…</p>

      <template v-if="!loading">
        <button
          v-for="conversation in conversations"
          :key="conversation.sessionId"
          type="button"
          class="inbox-list__item w-full cursor-pointer border-b border-border px-4 py-3 text-left transition-colors duration-300 ease-premium"
          :class="{ 'is-active': conversation.sessionId === activeSessionId }"
          @click="$emit('select', conversation.sessionId)"
        >
          <div class="flex items-start justify-between gap-2">
            <p class="truncate text-sm font-medium">
              {{ conversation.guestName || 'Гость' }}
            </p>
            <Badge v-if="unreadBySession[conversation.sessionId]" variant="unread">
              {{ unreadBySession[conversation.sessionId] }}
            </Badge>
          </div>

          <p class="mt-0.5 truncate text-xs text-muted-foreground">
            {{ conversation.guestEmail || conversation.sessionId.slice(0, 8) }}
          </p>

          <p v-if="conversation.lastMessage" class="mt-2 line-clamp-2 text-xs text-foreground/55">
            {{ conversation.lastMessage.text }}
          </p>

          <p class="mt-2 text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
            {{ formatTime(conversation.updatedAt) }}
          </p>
        </button>

        <p v-if="!conversations.length" class="px-4 py-6 text-sm text-muted-foreground">
          Пока нет обращений
        </p>

        <p
          v-if="conversations.length && loadingMore"
          class="px-4 py-3 text-center text-xs text-muted-foreground"
        >
          Загрузка…
        </p>
      </template>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { ConversationListItem } from '~/types/chat'

const props = defineProps<{
  conversations: ConversationListItem[]
  activeSessionId: string | null
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  unreadBySession: Record<string, number>
}>()

defineEmits<{
  select: [sessionId: string]
}>()

const inbox = useInboxStore()
const listEl = ref<HTMLElement | null>(null)

const listScroll = useScrollLoad(
  () => listEl.value,
  () => inbox.loadMoreConversations(),
  {
    canLoadMore: () =>
      inbox.conversationsHasMore && !inbox.loadingConversations && !inbox.loadingMoreConversations,
    isScrollTrigger: isNearScrollBottom,
  },
)

const isUnderfilled = (element: HTMLElement) => element.scrollHeight <= element.clientHeight + 1

async function ensureListFilled() {
  if (!props.hasMore || props.loading) return
  await listScroll.ensureFilled(isUnderfilled)
}

watch(
  () => [props.loading, props.hasMore, props.conversations.length] as const,
  async ([loading, hasMore]) => {
    if (loading || !hasMore) return
    await ensureListFilled()
  },
)

onMounted(async () => {
  await ensureListFilled()
})

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<style scoped lang="scss">
.inbox-list {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--foreground) 18%, transparent) transparent;
}

.inbox-list__item {
  &:hover,
  &.is-active {
    background: var(--accent);
  }

  &.is-active {
    border-left: 2px solid color-mix(in srgb, var(--primary) 80%, transparent);
    padding-left: calc(1rem - 2px);
  }
}
</style>
