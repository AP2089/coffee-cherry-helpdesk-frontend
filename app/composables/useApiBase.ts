function resolveLocalBackendUrl(configured: string, defaultPort: string): string {
  try {
    const parsed = new URL(configured)

    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      const port = parsed.port || defaultPort
      return `${window.location.protocol}//${window.location.hostname}:${port}${parsed.pathname.replace(/\/$/, '')}`
    }

    return configured.replace(/\/$/, '')
  } catch {
    return configured
  }
}

export function useApiBase(): string {
  const config = useRuntimeConfig()

  if (import.meta.client) {
    return resolveLocalBackendUrl(String(config.public.apiUrl), '3013')
  }

  return String(config.apiUrl).replace(/\/$/, '')
}

export function useSocketUrl(): string {
  const config = useRuntimeConfig()
  const configured = String(config.public.socketUrl || 'http://127.0.0.1:3013')

  if (!import.meta.client) return configured.replace(/\/$/, '')

  return resolveLocalBackendUrl(configured, '3013')
}

const AUTH_TOKEN_KEY = 'coffee-cherry-helpdesk-token'
const AUTH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30

const cookieOptions = {
  default: () => null as string | null,
  maxAge: AUTH_TOKEN_MAX_AGE,
  sameSite: 'lax' as const,
  path: '/',
}

function readDocumentCookie(name: string): string | null {
  if (!import.meta.client) return null

  const escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function writeDocumentCookie(name: string, value: string | null): void {
  if (!import.meta.client) return

  if (value === null) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
    return
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${AUTH_TOKEN_MAX_AGE}; SameSite=Lax`
}

function withAuthCookie<T>(fn: (cookie: Ref<string | null>) => T, fallback: () => T): T {
  const nuxtApp = tryUseNuxtApp()
  if (!nuxtApp) return fallback()

  try {
    return nuxtApp.runWithContext(() => {
      const cookie = useCookie<string | null>(AUTH_TOKEN_KEY, cookieOptions)
      return fn(cookie)
    })
  } catch {
    return fallback()
  }
}

export function getAuthToken(): string | null {
  return withAuthCookie(
    (cookie) => cookie.value ?? null,
    () => readDocumentCookie(AUTH_TOKEN_KEY),
  )
}

export function saveAuthToken(token: string): void {
  withAuthCookie(
    (cookie) => {
      cookie.value = token
    },
    () => writeDocumentCookie(AUTH_TOKEN_KEY, token),
  )

  if (import.meta.client) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

export function clearAuthToken(): void {
  withAuthCookie(
    (cookie) => {
      cookie.value = null
    },
    () => writeDocumentCookie(AUTH_TOKEN_KEY, null),
  )

  if (import.meta.client) {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}

export function migrateAuthTokenFromLocalStorage(): void {
  if (!import.meta.client) return

  const legacy = localStorage.getItem(AUTH_TOKEN_KEY)
  if (!legacy) return

  if (!getAuthToken()) {
    saveAuthToken(legacy)
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY)
  }
}
