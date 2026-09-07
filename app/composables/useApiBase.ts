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

export function getAuthToken(): string | null {
  if (!import.meta.client) return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function saveAuthToken(token: string): void {
  if (!import.meta.client) return
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  if (!import.meta.client) return
  localStorage.removeItem(AUTH_TOKEN_KEY)
}
