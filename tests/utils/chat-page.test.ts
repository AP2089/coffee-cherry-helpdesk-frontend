import { describe, expect, it } from 'vitest'
import {
  normalizeConversationPage,
  normalizeMessagesPage,
  prependOlderMessages,
} from '~/utils/chat-page'
import type { ChatMessage } from '~/types/chat'

describe('chat-page utils', () => {
  it('normalizeConversationPage handles legacy array response', () => {
    const page = normalizeConversationPage([{ sessionId: '1' } as never])

    expect(page.items).toHaveLength(1)
    expect(page.hasMore).toBe(false)
  })

  it('normalizeConversationPage handles paginated response', () => {
    const page = normalizeConversationPage({
      items: [{ sessionId: '1' }],
      total: 2,
      hasMore: true,
    })

    expect(page.hasMore).toBe(true)
    expect(page.items).toHaveLength(1)
  })

  it('normalizeMessagesPage maps payload', () => {
    const page = normalizeMessagesPage({
      meta: { sessionId: '1', guestName: 'Guest', guestEmail: 'a@b.c', status: 'open' },
      messages: [{ id: 'm1' } as ChatMessage],
      hasMore: true,
    })

    expect(page.meta?.sessionId).toBe('1')
    expect(page.messages).toHaveLength(1)
    expect(page.hasMore).toBe(true)
  })

  it('prependOlderMessages skips duplicates', () => {
    const current = [{ id: '2', sessionId: '1', sender: 'user', text: 'b', createdAt: '' }]
    const older = [
      { id: '1', sessionId: '1', sender: 'user', text: 'a', createdAt: '' },
      { id: '2', sessionId: '1', sender: 'user', text: 'dup', createdAt: '' },
    ]

    const result = prependOlderMessages(current, older)

    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe('1')
    expect(result[1]?.id).toBe('2')
  })
})
