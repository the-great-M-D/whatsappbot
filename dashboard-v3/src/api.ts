export interface User {
  id: string
  username: string
  roles: string[]
  permissions: string[]
}

export interface Instance {
  id: string
  slug: string
  name: string
  status: string
  desiredState: string
  config: Record<string, unknown>
}

export interface InstanceList {
  items: Instance[]
  nextCursor: string | null
}

function csrfToken(): string | undefined {
  const match = document.cookie.split(';').map((v) => v.trim()).find((v) => v.startsWith('v3_csrf='))
  return match ? decodeURIComponent(match.slice('v3_csrf='.length)) : undefined
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = csrfToken()
    if (token) headers.set('x-csrf-token', token)
  }
  const response = await fetch(path, { ...init, headers, credentials: 'include' })
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const body = await response.json() as { error?: { message?: string } }
      if (body.error?.message) message = body.error.message
    } catch {}
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  me: () => request<{ user: User }>('/api/v1/auth/me'),
  login: (username: string, password: string) => request<{ user: User }>('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<void>('/api/v1/auth/logout', { method: 'POST' }),
  instances: () => request<InstanceList>('/api/v1/instances?limit=100'),
  lifecycle: (id: string, action: 'start' | 'stop' | 'restart' | 'reconnect') => request<Instance>(`/api/v1/instances/${id}/${action}`, { method: 'POST' }),
}
