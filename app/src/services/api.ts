export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

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
