const AUTH_TOKEN_KEY = 'coffee-cherry-helpdesk-token'

export default defineNuxtRouteMiddleware(async (to) => {
  // Редиректы только на клиенте — иначе SSR без cookie уводит на /login,
  // и адрес мелькает даже при валидной сессии.
  if (import.meta.server) return

  const auth = useAuthStore()
  const tokenCookie = useCookie<string | null>(AUTH_TOKEN_KEY, {
    default: () => null,
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
    path: '/',
  })

  const legacy = localStorage.getItem(AUTH_TOKEN_KEY)
  if (legacy && !tokenCookie.value) {
    tokenCookie.value = legacy
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }

  auth.token = tokenCookie.value

  const isLogin = to.path === '/login'

  if (isLogin) {
    if (auth.token && !auth.user) {
      await auth.fetchMe()
    }

    if (auth.isAuthenticated) {
      return navigateTo('/', { replace: true })
    }

    auth.markReady()
    return
  }

  if (!auth.token) {
    return navigateTo('/login', { replace: true })
  }

  if (!auth.user) {
    await auth.fetchMe()
  }

  if (!auth.isAuthenticated) {
    return navigateTo('/login', { replace: true })
  }

  auth.markReady()
})
