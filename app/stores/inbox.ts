import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Socket } from 'socket.io-client'
import type { ChatMessage, ConversationListItem, ConversationMeta } from '~/types/chat'
import {
  apiDeleteConversation,
  apiGetConversationMessages,
  apiGetConversations,
} from '~/api/conversations'
import { useSocketUrl } from '~/composables/useApiBase'
import { GUEST_EDIT_DENIED_MESSAGE } from '~/composables/useCanEdit'
import { useAuthStore } from '~/stores/auth'
import {
  normalizeConversationPage,
  normalizeMessagesPage,
  prependOlderMessages,
} from '~/utils/chat-page'

const PAGE_SIZE = 20

let socket: Socket | null = null

export const useInboxStore = defineStore('inbox', () => {
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const conversations = ref<ConversationListItem[]>([])
  const conversationsHasMore = ref(false)
  const loadingConversations = ref(false)
  const loadingMoreConversations = ref(false)
  const activeSessionId = ref<string | null>(null)
  const activeMeta = ref<ConversationMeta | null>(null)
  const messages = ref<ChatMessage[]>([])
  const messagesHasMore = ref(false)
  const loadingMessages = ref(false)
  const loadingMoreMessages = ref(false)
  const deletingConversation = ref(false)
  const error = ref<string | null>(null)
  const unreadBySession = ref<Record<string, number>>({})

  const activeConversation = computed(
    () => conversations.value.find((item) => item.sessionId === activeSessionId.value) ?? null,
  )

  const totalUnread = computed(() =>
    Object.values(unreadBySession.value).reduce((sum, count) => sum + count, 0),
  )

  function authHeaders() {
    const auth = useAuthStore()
    return {
      Authorization: `Bearer ${auth.token}`,
    }
  }

  async function fetchConversations() {
    loadingConversations.value = true
    error.value = null

    try {
      const response = await apiGetConversations(
        { limit: PAGE_SIZE, offset: 0 },
        { headers: authHeaders() },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load conversations')
      }

      const page = normalizeConversationPage(response.data)
      conversations.value = page.items
      conversationsHasMore.value = page.hasMore
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load conversations'
      throw err
    } finally {
      loadingConversations.value = false
    }
  }

  async function loadMoreConversations() {
    if (loadingMoreConversations.value || !conversationsHasMore.value) return

    loadingMoreConversations.value = true
    error.value = null

    try {
      const response = await apiGetConversations(
        { limit: PAGE_SIZE, offset: conversations.value.length },
        { headers: authHeaders() },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load conversations')
      }

      if (Array.isArray(response.data)) {
        conversationsHasMore.value = false
        return
      }

      const page = normalizeConversationPage(response.data)

      const existingIds = new Set(conversations.value.map((item) => item.sessionId))

      for (const item of page.items) {
        if (existingIds.has(item.sessionId)) continue
        conversations.value.push(item)
      }

      conversationsHasMore.value = page.hasMore
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load conversations'
    } finally {
      loadingMoreConversations.value = false
    }
  }

  async function fetchMessages(sessionId: string) {
    loadingMessages.value = true
    error.value = null
    messages.value = []
    messagesHasMore.value = false

    try {
      const response = await apiGetConversationMessages(
        sessionId,
        { limit: PAGE_SIZE },
        { headers: authHeaders() },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load messages')
      }

      const page = normalizeMessagesPage(response.data)

      activeSessionId.value = sessionId
      activeMeta.value = page.meta
      messages.value = page.messages
      messagesHasMore.value = page.hasMore
      unreadBySession.value[sessionId] = 0
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load messages'
      throw err
    } finally {
      loadingMessages.value = false
    }
  }

  async function loadOlderMessages() {
    if (
      loadingMoreMessages.value ||
      !messagesHasMore.value ||
      !activeSessionId.value ||
      !messages.value.length
    ) {
      return
    }

    loadingMoreMessages.value = true
    error.value = null

    const sessionId = activeSessionId.value
    const before = messages.value[0]?.id

    try {
      const response = await apiGetConversationMessages(
        sessionId,
        {
          limit: PAGE_SIZE,
          before,
        },
        { headers: authHeaders() },
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load messages')
      }

      if (activeSessionId.value !== sessionId) return

      const page = normalizeMessagesPage(response.data)

      const existingIds = new Set(messages.value.map((item) => item.id))
      const older = page.messages.filter((item) => !existingIds.has(item.id))

      if (!older.length) {
        messagesHasMore.value = false
        return
      }

      messages.value = prependOlderMessages(messages.value, older)
      messagesHasMore.value = page.hasMore
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load messages'
    } finally {
      loadingMoreMessages.value = false
    }
  }

  async function selectConversation(sessionId: string) {
    await fetchMessages(sessionId)

    if (socket?.connected) {
      socket.emit('support:agent:select', { sessionId })
    }
  }

  function clearActiveConversation() {
    activeSessionId.value = null
    activeMeta.value = null
    messages.value = []
    messagesHasMore.value = false
    loadingMessages.value = false
    loadingMoreMessages.value = false
  }

  async function deleteConversation(sessionId: string) {
    if (deletingConversation.value) return

    deletingConversation.value = true
    error.value = null

    try {
      const response = await apiDeleteConversation(sessionId, {
        headers: authHeaders(),
      })

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete conversation')
      }

      conversations.value = conversations.value.filter((item) => item.sessionId !== sessionId)

      if (sessionId in unreadBySession.value) {
        const { [sessionId]: _removed, ...rest } = unreadBySession.value
        unreadBySession.value = rest
      }

      if (activeSessionId.value === sessionId) {
        activeSessionId.value = null
        activeMeta.value = null
        messages.value = []
        messagesHasMore.value = false
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete conversation'
      throw err
    } finally {
      deletingConversation.value = false
    }
  }

  function upsertConversationFromMessage(message: ChatMessage, meta?: ConversationMeta | null) {
    const existingIndex = conversations.value.findIndex(
      (item) => item.sessionId === message.sessionId,
    )

    const nextItem: ConversationListItem = {
      sessionId: message.sessionId,
      guestName: meta?.guestName ?? conversations.value[existingIndex]?.guestName ?? '',
      guestEmail: meta?.guestEmail ?? conversations.value[existingIndex]?.guestEmail ?? '',
      status: meta?.status ?? conversations.value[existingIndex]?.status ?? 'open',
      updatedAt: message.createdAt,
      lastMessage: {
        text: message.text,
        sender: message.sender,
        createdAt: message.createdAt,
      },
    }

    if (existingIndex === -1) {
      conversations.value.unshift(nextItem)
      return
    }

    conversations.value.splice(existingIndex, 1)
    conversations.value.unshift(nextItem)
  }

  function appendMessage(message: ChatMessage) {
    if (message.sessionId !== activeSessionId.value) return
    if (messages.value.some((item) => item.id === message.id)) return
    messages.value.push(message)
  }

  async function connectSocket() {
    if (!import.meta.client || isConnecting.value || socket?.connected) return

    const auth = useAuthStore()
    if (!auth.token) return

    isConnecting.value = true
    error.value = null

    const { io } = await import('socket.io-client')

    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }

    socket = io(useSocketUrl(), {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    })

    socket.on('connect', () => {
      isConnected.value = true
      isConnecting.value = false
      socket?.emit('support:agent:join', { token: auth.token })
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    socket.on('support:agent:joined', () => {
      if (activeSessionId.value) {
        socket?.emit('support:agent:select', { sessionId: activeSessionId.value })
      }
    })

    socket.on(
      'support:user-message',
      (payload: { sessionId?: string; message?: ChatMessage; meta?: ConversationMeta | null }) => {
        if (!payload.message || !payload.sessionId) return

        upsertConversationFromMessage(payload.message, payload.meta)

        if (payload.sessionId !== activeSessionId.value) {
          unreadBySession.value[payload.sessionId] =
            (unreadBySession.value[payload.sessionId] ?? 0) + 1
          return
        }

        appendMessage(payload.message)
      },
    )

    socket.on('support:message', (payload: { message?: ChatMessage }) => {
      if (!payload.message) return

      upsertConversationFromMessage(payload.message, activeMeta.value)

      if (payload.message.sessionId === activeSessionId.value) {
        appendMessage(payload.message)
      }
    })

    socket.on(
      'support:agent:history',
      (payload: { sessionId?: string; meta?: ConversationMeta }) => {
        if (!payload.sessionId || payload.sessionId !== activeSessionId.value) return

        activeMeta.value = payload.meta ?? activeMeta.value
        unreadBySession.value[payload.sessionId] = 0
      },
    )

    socket.on('support:error', (payload: { message?: string }) => {
      const message = payload.message ?? 'Socket error'
      error.value = message

      if (message === GUEST_EDIT_DENIED_MESSAGE) {
        useToast().show(message)
      }
    })

    socket.on('connect_error', () => {
      isConnected.value = false
      isConnecting.value = false
      error.value = 'connection'
    })
  }

  function sendReply(text: string) {
    const trimmed = text.trim()
    if (!trimmed || !activeSessionId.value || !socket?.connected) return false

    const auth = useAuthStore()
    if (auth.isGuest) {
      useToast().show(GUEST_EDIT_DENIED_MESSAGE)
      return false
    }

    socket.emit('support:agent:reply', {
      sessionId: activeSessionId.value,
      text: trimmed,
    })

    return true
  }

  function disconnectSocket() {
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
      socket = null
    }

    isConnected.value = false
    isConnecting.value = false
  }

  return {
    isConnected,
    isConnecting,
    conversations,
    conversationsHasMore,
    loadingConversations,
    loadingMoreConversations,
    activeSessionId,
    activeMeta,
    messages,
    messagesHasMore,
    loadingMessages,
    loadingMoreMessages,
    deletingConversation,
    error,
    unreadBySession,
    activeConversation,
    totalUnread,
    authHeaders,
    fetchConversations,
    loadMoreConversations,
    fetchMessages,
    loadOlderMessages,
    selectConversation,
    clearActiveConversation,
    deleteConversation,
    upsertConversationFromMessage,
    appendMessage,
    connectSocket,
    sendReply,
    disconnectSocket,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInboxStore, import.meta.hot))
}
