import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useInboxStore } from '~/stores/inbox'

describe('inbox store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('calculates totalUnread', () => {
    const store = useInboxStore()
    store.unreadBySession = { a: 2, b: 3 }

    expect(store.totalUnread).toBe(5)
  })

  it('returns active conversation by session id', () => {
    const store = useInboxStore()
    store.conversations = [
      {
        sessionId: 'session-1',
        guestName: 'Guest',
        guestEmail: 'guest@test.com',
        status: 'open',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    store.activeSessionId = 'session-1'

    expect(store.activeConversation?.guestEmail).toBe('guest@test.com')
  })

  it('sendReply returns false when socket is disconnected', () => {
    const store = useInboxStore()
    store.activeSessionId = 'session-1'

    expect(store.sendReply('hello')).toBe(false)
  })
})
