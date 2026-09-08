import { defineStore } from 'pinia'
import { UserRole, type AuthUser } from '~/types/chat'
import { apiGetAuthMe, apiPostAuthLogin } from '~/api/auth'
import {
  clearAuthToken,
  getAuthToken,
  migrateAuthTokenFromLocalStorage,
  saveAuthToken,
} from '~/composables/useApiBase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null as string | null,
    user: null as AuthUser | null,
    loading: false,
    ready: false,
    error: null as string | null,
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.user),
    isGuest: (state) => state.user?.role === UserRole.Guest || state.user?.username === 'guest',
  },

  actions: {
    markReady() {
      if (import.meta.client) {
        this.ready = true
      }
    },

    hydrate() {
      migrateAuthTokenFromLocalStorage()
      this.token = getAuthToken()
    },

    async login(username: string, password: string) {
      this.loading = true
      this.error = null

      try {
        const response = await apiPostAuthLogin({ username, password })

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Login failed')
        }

        this.token = response.data.token
        this.user = response.data.user
        saveAuthToken(response.data.token)
      } catch (error) {
        this.token = null
        this.user = null
        clearAuthToken()

        const fetchError = error as {
          data?: { message?: string }
          statusCode?: number
          message?: string
        }

        if (fetchError.statusCode === 401) {
          this.error = 'Неверный логин или пароль'
        } else if (fetchError.data?.message) {
          this.error = fetchError.data.message
        } else if (fetchError.message?.includes('fetch')) {
          this.error = 'Не удалось подключиться к серверу'
        } else {
          this.error = 'Не удалось войти'
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchMe() {
      if (!this.token) return

      try {
        const response = await apiGetAuthMe({
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })

        if (!response.success || !response.data) {
          throw new Error('Unauthorized')
        }

        this.user = response.data
      } catch {
        this.logout()
      }
    },

    logout() {
      this.token = null
      this.user = null
      clearAuthToken()
    },
  },
})
