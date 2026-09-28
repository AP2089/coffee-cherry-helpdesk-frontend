import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { UserRole } from '~/types/chat'
import { useAuthStore } from '~/stores/auth'

const { saveAuthToken, clearAuthToken } = vi.hoisted(() => ({
  saveAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}))

const { apiPostAuthLogin, apiGetAuthMe } = vi.hoisted(() => ({
  apiPostAuthLogin: vi.fn(),
  apiGetAuthMe: vi.fn(),
}))

vi.mock('~/composables/useApiBase', () => ({
  useApiBase: () => 'http://localhost:3013/api',
  getAuthToken: vi.fn(() => null),
  saveAuthToken,
  clearAuthToken,
  migrateAuthTokenFromLocalStorage: vi.fn(),
}))

vi.mock('~/api/auth', () => ({
  apiPostAuthLogin,
  apiGetAuthMe,
}))

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    apiPostAuthLogin.mockReset()
    apiGetAuthMe.mockReset()
    saveAuthToken.mockClear()
    clearAuthToken.mockClear()
  })

  it('isAuthenticated is false without token or user', () => {
    const store = useAuthStore()

    expect(store.isAuthenticated).toBe(false)
  })

  it('isAuthenticated is true with token and user', () => {
    const store = useAuthStore()
    store.token = 'token'
    store.user = { username: 'admin', role: UserRole.Admin }

    expect(store.isAuthenticated).toBe(true)
  })

  it('logout clears state and token', () => {
    const store = useAuthStore()
    store.token = 'token'
    store.user = { username: 'admin', role: UserRole.Admin }

    store.logout()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(clearAuthToken).toHaveBeenCalledOnce()
  })

  it('login saves token and user on success', async () => {
    const store = useAuthStore()
    const user = { username: 'admin', role: UserRole.Admin }

    apiPostAuthLogin.mockResolvedValue({
      success: true,
      data: { token: 'jwt-token', user },
    })

    await store.login('admin', 'secret')

    expect(store.token).toBe('jwt-token')
    expect(store.user).toEqual(user)
    expect(saveAuthToken).toHaveBeenCalledWith('jwt-token')
    expect(store.error).toBeNull()
  })

  it('login sets localized error on 401', async () => {
    const store = useAuthStore()

    apiPostAuthLogin.mockRejectedValue({
      statusCode: 401,
      message: 'Unauthorized',
    })

    await expect(store.login('admin', 'wrong')).rejects.toMatchObject({ statusCode: 401 })

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(store.error).toBe('Неверный логин или пароль')
    expect(clearAuthToken).toHaveBeenCalledOnce()
  })

  it('fetchMe loads user and logs out on failure', async () => {
    const store = useAuthStore()
    store.token = 'jwt-token'

    apiGetAuthMe.mockResolvedValueOnce({
      success: true,
      data: { username: 'admin', role: UserRole.Admin },
    })

    await store.fetchMe()

    expect(store.user?.username).toBe('admin')

    apiGetAuthMe.mockRejectedValueOnce(new Error('Unauthorized'))

    await store.fetchMe()

    expect(store.token).toBeNull()
    expect(store.user).toBeNull()
    expect(clearAuthToken).toHaveBeenCalled()
  })
})
