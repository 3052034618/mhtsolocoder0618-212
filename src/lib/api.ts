import type { RouteFilters } from '@/types'

const API_BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('token')
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function transformKeys<T>(obj: any): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(transformKeys) as T
  if (typeof obj === 'object') {
    const result: Record<string, any> = {}
    for (const key of Object.keys(obj)) {
      result[toCamelCase(key)] = transformKeys(obj[key])
    }
    return result as T
  }
  return obj
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json()
  if (!data.success) {
    throw new Error(data.error || '请求失败')
  }
  return transformKeys<T>(data.data)
}

export const api = {
  auth: {
    register: (username: string, email: string, password: string) =>
      request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<any>('/auth/me'),
  },

  routes: {
    list: (filters?: RouteFilters) => {
      const params = new URLSearchParams()
      if (filters?.province) params.set('province', filters.province)
      if (filters?.difficulty) params.set('difficulty', filters.difficulty)
      if (filters?.duration) params.set('duration', filters.duration)
      if (filters?.startPoint) params.set('startPoint', filters.startPoint)
      const qs = params.toString()
      return request<any[]>(`/routes${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => request<any>(`/routes/${id}`),
    create: (formData: FormData) =>
      request<any>('/routes', {
        method: 'POST',
        body: formData,
      }),
    toggleFavorite: (id: string) =>
      request<any>(`/routes/${id}/favorite`, { method: 'POST' }),
    reviews: (id: string) => request<any[]>(`/routes/${id}/reviews`),
    addReview: (id: string, review: any) =>
      request<any>(`/routes/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(review),
      }),
  },

  teams: {
    list: (filters?: { routeId?: string; status?: string }) => {
      const params = new URLSearchParams()
      if (filters?.routeId) params.set('routeId', filters.routeId)
      if (filters?.status) params.set('status', filters.status)
      const qs = params.toString()
      return request<any[]>(`/teams${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => request<any>(`/teams/${id}`),
    create: (data: any) =>
      request<any>('/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    join: (id: string) =>
      request<any>(`/teams/${id}/join`, { method: 'POST' }),
    approve: (id: string, userId: string, approved: boolean) =>
      request<any>(`/teams/${id}/approve`, {
        method: 'PUT',
        body: JSON.stringify({ userId, approved }),
      }),
    removeMember: (teamId: string, userId: string) =>
      request<any>(`/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),
    messages: (id: string) => request<any[]>(`/teams/${id}/messages`),
    sendMessage: (id: string, content: string) =>
      request<any>(`/teams/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  },

  safety: {
    checkin: (data: { teamId: string; routeId: string; expectedReturnTime: string }) =>
      request<any>('/safety/checkin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    checkout: () =>
      request<any>('/safety/checkout', { method: 'POST' }),
    status: () => request<any>('/safety/status'),
    updateContacts: (contacts: { name: string; phone: string }[]) =>
      request<any>('/safety/contacts', {
        method: 'PUT',
        body: JSON.stringify({ contacts }),
      }),
    getContacts: () => request<any[]>('/safety/contacts'),
  },

  users: {
    profile: (id: string) => request<any>(`/users/${id}/profile`),
    myRoutes: () => request<any[]>('/users/me/routes'),
    myFavorites: () => request<any[]>('/users/me/favorites'),
    myTeams: () => request<any[]>('/users/me/teams'),
  },
}
