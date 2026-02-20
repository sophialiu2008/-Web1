type Bucket = { count: number; windowStart: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now - b.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now })
    return true
    }
  if (b.count >= limit) return false
  b.count++
  return true
}

export function getClientIp(req: any): string {
  const h = req.headers['x-forwarded-for'] as string | undefined
  if (h) return h.split(',')[0].trim()
  return (req.ip || req.socket?.remoteAddress || 'unknown') as string
}

