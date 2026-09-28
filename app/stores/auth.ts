import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { UserRole, type AuthUser } from '~/types/chat'
import { apiGetAuthMe, apiPostAuthLogin } from '~/api/auth'
import {
  clearAuthToken,
  getAuthToken,
  migrateAuthTokenFromLocalStorage,
  saveAuthToken,
} from '~/composables/useApiBase'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const ready = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const isGuest = computed(
    () => user.value?.role === UserRole.Guest || user.value?.username === 'guest',
  )

  function markReady() {
    if (import.meta.client) {
      ready.value = true
    }
  }

  function hydrate() {
    migrateAuthTokenFromLocalStorage()
    token.value = getAuthToken()
  }

  async function login(username: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await apiPostAuthLogin({ username, password })

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed')
      }

      token.value = response.data.token
      user.value = response.data.user
      saveAuthToken(response.data.token)
    } catch (err) {
      token.value = null
      user.value = null
      clearAuthToken()

      const fetchError = err as {
        data?: { message?: string }
        statusCode?: number
        message?: string
      }

      if (fetchError.statusCode === 401) {
        error.value = 'Неверный логин или пароль'
      } else if (fetchError.data?.message) {
        error.value = fetchError.data.message
      } else if (fetchError.message?.includes('fetch')) {
        error.value = 'Не удалось подключиться к серверу'
      } else {
        error.value = 'Не удалось войти'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!token.value) return

    try {
      const response = await apiGetAuthMe({
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      if (!response.success || !response.data) {
        throw new Error('Unauthorized')
      }

      user.value = response.data
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = null
    user.value = null
    clearAuthToken()
  }

  return {
    token,
    user,
    loading,
    ready,
    error,
    isAuthenticated,
    isGuest,
    markReady,
    hydrate,
    login,
    fetchMe,
    logout,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
