const envBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
const fallbackBase = import.meta.env.DEV ? 'http://localhost:8787' : 'https://pet-adoption-server-jvx2.onrender.com'
const normalizedBase = envBase || fallbackBase
export const API_BASE = normalizedBase.replace('https://pet-adoption-eabj.onrender.com', 'https://pet-adoption-server-jvx2.onrender.com')

async function refreshTokensIfNeeded() {
  const { useUserStore } = await import('@/store/userStore')
  const r = await fetch(`${API_BASE}/v1/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include'
  })
  const j = await r.json()
  if (j?.code === 0 && j?.data?.access_token && j?.data?.refresh_token && j?.data?.expires_in) {
    useUserStore.getState().setTokens({
      accessToken: j.data.access_token,
      refreshToken: j.data.refresh_token,
      expiresIn: j.data.expires_in
    })
    return j.data.access_token as string
  }
  return null
}

async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { useUserStore } = await import('@/store/userStore')
  const { accessToken } = useUserStore.getState()
  const headers = new Headers(init.headers || {})
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const res = await fetch(input, { ...init, headers, credentials: 'include' })
  if (res.status !== 401) return res
  const newToken = await refreshTokensIfNeeded()
  if (!newToken) return res
  const retryHeaders = new Headers(init.headers || {})
  retryHeaders.set('Authorization', `Bearer ${newToken}`)
  return fetch(input, { ...init, headers: retryHeaders, credentials: 'include' })
}

export async function fetchProfile() {
  const r = await authFetch(`${API_BASE}/v1/auth/me`)
  if (!r.ok) throw new Error('Failed to fetch profile')
  return r.json()
}

export async function postPetView(petId: number) {
  try {
    const r = await fetch(`${API_BASE}/api/analytics/pet-view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pet_id: petId })
    })
    return r.ok
  } catch {
    return false
  }
}

export async function submitApplication(payload: Record<string, unknown>) {
  const r = await fetch(`${API_BASE}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!r.ok) {
    let errorMsg = `HTTP ${r.status} ${r.statusText}: request failed`
    try {
      const ct = r.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const data: unknown = await r.json()
        const msg = (data && typeof data === 'object' && ('error' in (data as Record<string, unknown>) || 'message' in (data as Record<string, unknown>)))
          ? String((data as Record<string, unknown>)['error'] ?? (data as Record<string, unknown>)['message'] ?? '')
          : ''
        errorMsg = `HTTP ${r.status} ${r.statusText}: ${msg || 'request failed'}`
      } else {
        const text = await r.text()
        if (text && text.trim().length > 0) {
          errorMsg = `HTTP ${r.status} ${r.statusText}: ${text}`
        }
      }
    } catch {
      // ignore parse errors, keep default errorMsg
    }
    throw new Error(errorMsg)
  }
  return r.json()
}

export async function postAnalyticsEvent(type: string, id?: string, meta?: Record<string, unknown>) {
  try {
    await fetch(`${API_BASE}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, meta })
    })
  } catch {
    return
  }
}

export async function submitBooking(payload: Record<string, unknown>) {
  const r = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error('request failed')
  return r.json()
}

export async function getCaptcha() {
  const r = await fetch(`${API_BASE}/v1/auth/captcha`)
  const j = await r.json()
  return j.data as { id: string; svg: string }
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/v1/auth/check-email?email=${encodeURIComponent(email)}`)
    if (!r.ok) return false
    const j = await r.json()
    return !!j.exists
  } catch {
    return false
  }
}

export async function registerEmail(payload: {
  email: string
  password: string
  captcha_id: string
  captcha_answer: string
}) {
  const r = await fetch(`${API_BASE}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  })
  return r.json()
}

export async function verifyEmail(payload: { email: string; code: string }) {
  const r = await fetch(`${API_BASE}/v1/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  })
  return r.json()
}

export async function loginEmail(payload: { email: string; password: string }) {
  const r = await fetch(`${API_BASE}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  })
  return r.json()
}

export async function refreshToken() {
  const r = await fetch(`${API_BASE}/v1/auth/refresh-token`, {
    method: 'POST',
    credentials: 'include'
  })
  return r.json()
}

export async function forgotPassword(payload: { email: string }) {
  const r = await fetch(`${API_BASE}/v1/auth/password/forgot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return r.json()
}

export async function resetPasswordWithToken(payload: { token: string; new_password: string }) {
  const r = await fetch(`${API_BASE}/v1/auth/password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return r.json()
}

export async function createPet(payload: FormData, onProgress?: (percent: number) => void) {
  const { useUserStore } = await import('@/store/userStore')
  const state = useUserStore.getState()
  let accessToken = state.accessToken || null
  let accessExpiresAt = state.accessExpiresAt || null
  if (!accessToken && typeof localStorage !== 'undefined') {
    try {
      const raw = localStorage.getItem('user-storage')
      if (raw) {
        const parsed = JSON.parse(raw) as { state?: { accessToken?: string | null; accessExpiresAt?: number | null } }
        accessToken = parsed.state?.accessToken || accessToken
        accessExpiresAt = parsed.state?.accessExpiresAt || accessExpiresAt
      }
    } catch (e) {
      void e
    }
  }
  const expired = accessExpiresAt ? Date.now() >= accessExpiresAt : false
  const baseToken = accessToken && !expired ? accessToken : await refreshTokensIfNeeded()
  const uploadOnce = (token?: string | null) =>
    new Promise<Record<string, unknown>>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API_BASE}/api/pets`)
      xhr.timeout = 45000
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      xhr.withCredentials = true
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      xhr.ontimeout = () => reject({ status: 408 })
      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (xhr.status >= 200 && xhr.status < 300) return resolve(json)
          return reject({ status: xhr.status, json })
        } catch {
          return reject({ status: xhr.status })
        }
      }
      xhr.onerror = () => reject({ status: xhr.status })
      xhr.send(payload)
    })
  try {
    if (!baseToken) return uploadOnce(baseToken)
    return await uploadOnce(baseToken)
  } catch (e) {
    const err = e as { status?: number; json?: { error?: string } }
    if (err?.status === 401) {
      const newToken = await refreshTokensIfNeeded()
      if (newToken) return uploadOnce(newToken)
      return Promise.reject({ status: 401, json: { error: 'unauthorized' } })
    }
    return Promise.reject(e)
  }
}

export async function fetchPets(params: {
  category?: string
  city?: string
  gender?: string
  is_vaccinated?: boolean
  is_neutered?: boolean
  page?: number
  pageSize?: number
  user_id?: string
}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    q.set(k, String(v))
  })
  const r = await authFetch(`${API_BASE}/api/pets?${q.toString()}`)
  if (!r.ok) throw new Error('request failed')
  return r.json()
}

export async function fetchPetDetail(id: string) {
  const r = await fetch(`${API_BASE}/api/pets/${encodeURIComponent(id)}`)
  if (!r.ok) throw new Error('request failed')
  return r.json()
}

export async function updatePet(id: string, payload: Record<string, unknown>) {
  const r = await authFetch(`${API_BASE}/api/pets/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error('request failed')
  return r.json()
}

export async function deletePet(id: string) {
  const r = await authFetch(`${API_BASE}/api/pets/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
  if (!r.ok) throw new Error('request failed')
  return r.json()
}

export async function fetchApplications(userId: string) {
  const r = await fetch(`${API_BASE}/api/applications?user_id=${encodeURIComponent(userId)}`)
  if (!r.ok) return []
  return r.json()
}

export async function fetchBookings(userId: string) {
  const r = await fetch(`${API_BASE}/api/bookings?user_id=${encodeURIComponent(userId)}`)
  if (!r.ok) return []
  return r.json()
}

export async function sendSmsOtp(phone: string) {
  const r = await fetch(`${API_BASE}/v1/auth/sms/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
    credentials: 'include'
  })
  return r.json()
}

export async function verifySmsOtp(phone: string, token: string) {
  const r = await fetch(`${API_BASE}/v1/auth/sms/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, token }),
    credentials: 'include'
  })
  return r.json()
}

// Administrative APIs
export async function fetchAdminStats() {
  const r = await authFetch(`${API_BASE}/api/admin/stats`)
  if (!r.ok) throw new Error('Failed to fetch admin stats')
  return r.json()
}

export async function fetchAdminUsers(params: { page?: number; pageSize?: number; search?: string }) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== '') q.set(k, String(v))
  })
  const r = await authFetch(`${API_BASE}/api/admin/users?${q.toString()}`)
  if (!r.ok) throw new Error('Failed to fetch users')
  return r.json()
}

export async function updateUserStatus(userId: string, status: string) {
  const r = await authFetch(`${API_BASE}/api/admin/users/${userId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  if (!r.ok) throw new Error('Failed to update user status')
  return r.json()
}

export async function fetchAdminApplications(params: { page?: number; pageSize?: number }) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== '') q.set(k, String(v))
  })
  const r = await authFetch(`${API_BASE}/api/admin/applications?${q.toString()}`)
  if (!r.ok) throw new Error('Failed to fetch applications')
  return r.json()
}

export async function reviewApplication(id: string, payload: { status: string; pet_id?: string; user_id?: string }) {
  const r = await authFetch(`${API_BASE}/api/admin/applications/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!r.ok) throw new Error('Failed to review application')
  return r.json()
}

export async function fetchAdminBookings(params: { page?: number; pageSize?: number }) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== '') q.set(k, String(v))
  })
  const r = await authFetch(`${API_BASE}/api/admin/bookings?${q.toString()}`)
  if (!r.ok) throw new Error('Failed to fetch bookings')
  return r.json()
}

export async function updateBookingStatus(id: string, status: string) {
  const r = await authFetch(`${API_BASE}/api/admin/bookings/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  if (!r.ok) throw new Error('Failed to update booking status')
  return r.json()
}

export async function fetchAdminPets(params: { page?: number; pageSize?: number }) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== '') q.set(k, String(v))
  })
  const r = await authFetch(`${API_BASE}/api/admin/pets?${q.toString()}`)
  if (!r.ok) throw new Error('Failed to fetch pets')
  return r.json()
}

export async function fetchAdminStories(params: { page?: number; pageSize?: number }) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v) !== '') q.set(k, String(v))
  })
  const r = await authFetch(`${API_BASE}/api/admin/stories?${q.toString()}`)
  if (!r.ok) throw new Error('Failed to fetch stories')
  return r.json()
}

export async function updateStoryStatus(id: string, status: string) {
  const r = await authFetch(`${API_BASE}/api/admin/stories/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  })
  if (!r.ok) throw new Error('Failed to update story status')
  return r.json()
}

export async function fetchNearbyPets(params: { lat: number; lng: number; radius?: number; limit?: number }) {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    ...(params.radius ? { radius: String(params.radius) } : {}),
    ...(params.limit ? { limit: String(params.limit) } : {}),
  })
  const r = await fetch(`${API_BASE}/api/pets/nearby?${qs}`)
  if (!r.ok) throw new Error('Failed to fetch nearby pets')
  return r.json()
}
