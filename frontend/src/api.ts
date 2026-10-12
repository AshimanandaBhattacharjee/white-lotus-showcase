// Thin fetch wrapper. All HTTP lives here so components only call functions.
import type {
  FieldErrors,
  Inquiry,
  InquiryInput,
  Property,
  PropertyFilters,
  PropertyInput,
} from './types'

// Empty in dev (Vite proxies /api); the API origin in production.
const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const ADMIN_KEY_STORAGE = 'wl-admin-key'

export class ApiError extends Error {
  status: number
  fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// sessionStorage: the key is forgotten when the tab closes. Wrapped in
// try/catch because storage can throw in private modes.
export const adminKey = {
  get(): string | null {
    try {
      return sessionStorage.getItem(ADMIN_KEY_STORAGE)
    } catch {
      return null
    }
  },
  set(key: string) {
    try {
      sessionStorage.setItem(ADMIN_KEY_STORAGE, key)
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(ADMIN_KEY_STORAGE)
    } catch {
      /* ignore */
    }
  },
}

async function request<T>(path: string, options: RequestInit & { admin?: boolean } = {}): Promise<T> {
  const { admin, headers, ...rest } = options
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(admin ? { 'X-Admin-Key': adminKey.get() ?? '' } : {}),
        ...headers,
      },
    })
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.")
  }

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message = typeof body?.detail === 'string' ? body.detail : `Request failed (${res.status})`
    throw new ApiError(res.status, message, body?.errors ?? {})
  }
  return body as T
}

function toQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams()
  if (filters.location) params.set('location', filters.location)
  if (filters.min_bedrooms) params.set('min_bedrooms', String(filters.min_bedrooms))
  if (filters.sort) params.set('sort', filters.sort)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

export const api = {
  listProperties: (filters: PropertyFilters = {}) =>
    request<Property[]>(`/api/properties${toQuery(filters)}`),
  listLocations: () => request<string[]>('/api/properties/locations'),
  getProperty: (id: number) => request<Property>(`/api/properties/${id}`),

  createProperty: (data: PropertyInput) =>
    request<Property>('/api/properties', { method: 'POST', body: JSON.stringify(data), admin: true }),
  updateProperty: (id: number, data: PropertyInput) =>
    request<Property>(`/api/properties/${id}`, { method: 'PUT', body: JSON.stringify(data), admin: true }),
  deleteProperty: (id: number) =>
    request<void>(`/api/properties/${id}`, { method: 'DELETE', admin: true }),

  createInquiry: (propertyId: number, data: InquiryInput) =>
    request<Inquiry>(`/api/properties/${propertyId}/inquiries`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listInquiries: () => request<Inquiry[]>('/api/inquiries', { admin: true }),
}
