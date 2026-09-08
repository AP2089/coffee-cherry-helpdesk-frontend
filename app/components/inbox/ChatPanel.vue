<template>
  <section class="relative flex h-full min-h-0 flex-col overflow-hidden">
    <AlertDialog v-model:open="showDeleteConfirm">
      <template v-if="meta">
        <div class="shrink-0 border-b border-border px-4 py-3 md:px-6">
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                class="mt-0.5 shrink-0 md:hidden"
                aria-label="К списку диалогов"
                @click="emit('back')"
              >
                <ArrowLeft class="size-4" />
              </Button>
              <div class="min-w-0">
                <p class="text-sm font-medium">{{ meta.guestName || 'Гость' }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ meta.guestEmail }}</p>
              </div>
            </div>

            <AlertDialogTrigger v-if="canDelete" as-child>
              <Button
                type="button"
                variant="destructive-outline"
                size="sm"
                class="shrink-0 px-3 py-1.5"
                :disabled="deleting"
              >
                {{ deleting ? 'Удаление…' : 'Удалить' }}
              </Button>
            </AlertDialogTrigger>
          </div>
        </div>

        <div
          ref="messagesEl"
          class="inbox-messages min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 md:px-6"
          @scroll="messagesScroll.onScroll"
        >
          <p v-if="loadingMore" class="text-center text-xs text-muted-foreground">Загрузка…</p>

          <p v-if="loading" class="text-sm text-muted-foreground">Загрузка сообщений…</p>

          <article
            v-for="message in messages"
            :key="message.id"
            class="flex"
            :class="message.sender === 'agent' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[85%] border px-3 py-2 text-sm leading-relaxed"
              :class="
                message.sender === 'agent'
                  ? 'border-primary/25 bg-primary/20 text-foreground'
                  : 'border-border bg-muted text-foreground/80'
              "
            >
              <p
                class="mb-1 text-[10px] font-medium tracking-[0.08em] uppercase"
                :class="message.sender === 'agent' ? 'text-primary/70' : 'text-muted-foreground'"
              >
                {{ senderLabel(message.sender) }}
              </p>
              <p class="whitespace-pre-wrap break-words">{{ message.text }}</p>
              <p class="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
                {{ formatTime(message.createdAt) }}
              </p>
            </div>
          </article>
        </div>

        <form class="shrink-0 border-t border-border p-3 md:px-6" @submit.prevent="onSendClick">
          <div class="flex items-stretch gap-2">
            <Textarea
              v-model="draft"
              rows="2"
              class="min-h-[44px] max-h-28 flex-1"
              placeholder="Ответ клиенту…"
              :disabled="canEdit && !canSend"
              @keydown.enter.exact.prevent="onSendClick"
            />
            <Button
              type="submit"
              variant="magnetic-filled"
              class="h-auto w-11 shrink-0 self-stretch p-0"
              :disabled="canEdit && (!canSend || !draft.trim())"
              aria-label="Отправить"
            >
              <svg
                viewBox="0 0 24 24"
                class="h-4 w-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12l14-7-7 14-2-5-5-2z" />
              </svg>
            </Button>
          </div>
        </form>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle class="text-sm font-normal leading-relaxed text-foreground/85">
              Удалить диалог и все сообщения?
            </AlertDialogTitle>
            <AlertDialogDescription class="text-xs text-muted-foreground">
              {{ meta.guestName || 'Гость' }} · {{ meta.guestEmail || meta.sessionId.slice(0, 8) }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel :disabled="deleting">Отмена</AlertDialogCancel>
            <AlertDialogAction :disabled="deleting" @click="confirmDelete">
              {{ deleting ? 'Удаление…' : 'Удалить' }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </template>

      <div v-else class="hidden min-h-0 flex-1 items-center justify-center px-4 md:flex md:px-6">
        <p class="text-sm text-muted-foreground">Выберите диалог слева</p>
      </div>
    </AlertDialog>
  </section>
</template>

<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import type { ChatMessage, ChatSender, ConversationMeta } from '~/types/chat'

const props = defineProps<{
  meta: ConversationMeta | null
  messages: ChatMessage[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  canSend: boolean
  canDelete: boolean
  deleting: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
  delete: []
  back: []
}>()

const inbox = useInboxStore()
const { canEdit, assertCanEdit } = useCanEdit()
const draft = ref('')
const messagesEl = ref<HTMLElement | null>(null)
const showDeleteConfirm = ref(false)

function confirmDelete() {
  if (!assertCanEdit()) return
  emit('delete')
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function senderLabel(sender: ChatSender) {
  if (sender === 'agent') {
    return 'Саппорт'
  }

  return props.meta?.guestName || 'Пользователь'
}

function scrollToBottom() {
  nextTick(() => {
    if (!messagesEl.value) return
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

async function loadOlderMessages() {
  const el = messagesEl.value
  if (!el || inbox.loadingMessages || inbox.loadingMoreMessages || !inbox.messagesHasMore) return

  const previousHeight = el.scrollHeight
  await inbox.loadOlderMessages()

  await nextTick()
  if (!messagesEl.value) return
  messagesEl.value.scrollTop = messagesEl.value.scrollHeight - previousHeight
}

const messagesScroll = useScrollLoad(() => messagesEl.value, loadOlderMessages, {
  canLoadMore: () =>
    inbox.messagesHasMore &&
    !inbox.loadingMessages &&
    !inbox.loadingMoreMessages &&
    inbox.messages.length > 0,
  isScrollTrigger: isNearScrollTop,
})

function onSendClick() {
  if (!assertCanEdit()) return

  const text = draft.value.trim()
  if (!text || !props.canSend) return

  emit('send', text)
  draft.value = ''
}

watch(
  () => props.messages.at(-1)?.id,
  () => {
    scrollToBottom()
  },
)

watch(
  () => props.meta?.sessionId,
  async () => {
    showDeleteConfirm.value = false
    draft.value = ''
    scrollToBottom()
    await messagesScroll.ensureFilled((element) => element.scrollHeight <= element.clientHeight + 1)
  },
)

watch(
  () => [props.loading, props.hasMore] as const,
  async ([loading, hasMore]) => {
    if (loading || !hasMore) return
    await messagesScroll.ensureFilled((element) => element.scrollHeight <= element.clientHeight + 1)
  },
)
</script>

<style scoped lang="scss">
.inbox-messages {
  scrollbar-width: thin;
  scrollbar-color: color-mix(in srgb, var(--foreground) 18%, transparent) transparent;
}
</style>
