import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase.js'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'

const accessSecret = process.env.ACCESS_TOKEN_SECRET as string | undefined
const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string | undefined
let petsColumnsCache: { at: number; cols: Set<string> } | null = null
let petsIdInfoCache:
  | { at: number; info: { data_type?: string; column_default?: string | null; is_identity?: string | null } | null }
  | null = null

async function getPetsColumns(): Promise<Set<string> | null> {
  if (!supabase) return null
  const now = Date.now()
  if (petsColumnsCache && now - petsColumnsCache.at < 60 * 1000) return petsColumnsCache.cols
  const { data, error } = await supabase
    .schema('information_schema')
    .from('columns')
    .select('column_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'pets')
  if (error || !data) return null
  const cols = new Set(data.map((r) => String((r as any).column_name)))
  petsColumnsCache = { at: now, cols }
  return cols
}

async function getPetsIdInfo(): Promise<{ data_type?: string; column_default?: string | null; is_identity?: string | null } | null> {
  if (!supabase) return null
  const now = Date.now()
  if (petsIdInfoCache && now - petsIdInfoCache.at < 60 * 1000) return petsIdInfoCache.info
  const { data, error } = await supabase
    .schema('information_schema')
    .from('columns')
    .select('data_type,column_default,is_identity')
    .eq('table_schema', 'public')
    .eq('table_name', 'pets')
    .eq('column_name', 'id')
    .maybeSingle()
  if (error || !data) {
    petsIdInfoCache = { at: now, info: null }
    return null
  }
  const info = {
    data_type: (data as any).data_type as string | undefined,
    column_default: (data as any).column_default as string | null | undefined,
    is_identity: (data as any).is_identity as string | null | undefined
  }
  petsIdInfoCache = { at: now, info }
  return info
}

function getBearerToken(req: any): string | null {
  const raw = String(req.headers?.authorization || '')
  if (!raw.toLowerCase().startsWith('bearer ')) return null
  return raw.slice(7).trim()
}

function getAuthUserId(req: any): string | null {
  if (!accessSecret) return null
  let token = getBearerToken(req)
  if (!token) {
    const cookieToken = req?.cookies?.access_token
    if (cookieToken && typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
      token = cookieToken.trim()
    }
  }
  if (!token) return null
  try {
    const decoded = jwt.verify(token, accessSecret) as any
    return decoded?.sub ? String(decoded.sub) : null
  } catch {
    if (!refreshSecret) return null
    const refreshToken = req?.cookies?.refresh_token
    if (!refreshToken || typeof refreshToken !== 'string') return null
    try {
      const decoded = jwt.verify(refreshToken, refreshSecret) as any
      return decoded?.sub ? String(decoded.sub) : null
    } catch {
      return null
    }
  }
}

function parseBool(v: unknown): boolean | undefined {
  if (v === undefined || v === null || v === '') return undefined
  if (typeof v === 'boolean') return v
  const s = String(v).toLowerCase()
  if (s === 'true' || s === '1') return true
  if (s === 'false' || s === '0') return false
  return undefined
}

function parseStringArray(v: unknown): string[] {
  if (!v) return []
  if (Array.isArray(v)) return v.map((x) => String(x)).filter(Boolean)
  const s = String(v)
  try {
    const parsed = JSON.parse(s)
    if (Array.isArray(parsed)) return parsed.map((x) => String(x)).filter(Boolean)
  } catch {
    return s.split(',').map((x) => x.trim()).filter(Boolean)
  }
  return []
}

function normalizeText(v: unknown): string | null {
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s.length === 0 ? null : s
}

async function withTimeout<T>(promise: PromiseLike<T>, ms: number) {
  let timer: NodeJS.Timeout | null = null
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms)
  })
  try {
    return await Promise.race([Promise.resolve(promise), timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function petsRoutes(app: FastifyInstance) {
  app.get('/api/pets', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    try {
      const cols = await getPetsColumns()
      const q = (req.query as any)?.q as string | undefined
      const category = (req.query as any)?.category as string | undefined
      const city = (req.query as any)?.city as string | undefined
      const gender = (req.query as any)?.gender as string | undefined
      const isVaccinated = parseBool((req.query as any)?.is_vaccinated)
      const isNeutered = parseBool((req.query as any)?.is_neutered)
      const page = Math.max(1, Number((req.query as any)?.page || 1))
      const pageSize = Math.min(50, Math.max(1, Number((req.query as any)?.pageSize || 12)))
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const sort = (req.query as any)?.sort as string | undefined
      const breed = (req.query as any)?.breed as string | undefined
      const ageStatus = (req.query as any)?.age as string | undefined

      const userId = (req.query as any)?.user_id as string | undefined
      const authUserId = getAuthUserId(req)
      const onlyMine = userId && authUserId && userId === authUserId

      let query = supabase.from('pets').select('*', { count: 'exact' })
      if (sort === 'oldest') {
        query = query.order('created_at', { ascending: true })
      } else {
        query = query.order('created_at', { ascending: false })
      }
      if (!onlyMine && (!cols || cols.has('status'))) query = query.eq('status', 'available')
      if (onlyMine) query = query.eq('user_id', userId)
      if (category && (!cols || cols.has('category'))) query = query.eq('category', category)
      if (city && (!cols || cols.has('city'))) query = query.eq('city', city)
      if (gender && (!cols || cols.has('gender'))) query = query.eq('gender', gender)
      if (breed && (!cols || cols.has('breed'))) query = query.eq('breed', breed)
      if (ageStatus && (!cols || cols.has('age_years'))) {
        if (ageStatus === 'baby') query = query.lte('age_years', 1)
        else if (ageStatus === 'young') query = query.gt('age_years', 1).lte('age_years', 3)
        else if (ageStatus === 'adult') query = query.gt('age_years', 3).lte('age_years', 8)
        else if (ageStatus === 'senior') query = query.gt('age_years', 8)
      }
      if (isVaccinated !== undefined && (!cols || cols.has('is_vaccinated'))) query = query.eq('is_vaccinated', isVaccinated)
      if (isNeutered !== undefined && (!cols || cols.has('is_neutered'))) query = query.eq('is_neutered', isNeutered)
      if (q) {
        query = query.or(`name.ilike.%${q}%,breed.ilike.%${q}%,province.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%`)
      }
      const { data, error, count } = await query.range(from, to)
      if (error) return reply.status(500).send({ error: error.message })
      return reply.send({ data: data || [], total: count || 0, page, pageSize })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'query failed'
      return reply.status(500).send({ error: msg })
    }
  })

  app.get('/api/pets/:id', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const cols = await getPetsColumns()
    const id = String((req.params as any).id)
    const { data, error } = await supabase.from('pets').select('*').eq('id', id).single()
    if (error || !data) return reply.status(404).send({ error: 'Not found' })
    const current = Number(data.view_count || 0)
    if (!cols || cols.has('view_count')) {
      await supabase.from('pets').update({ view_count: current + 1, updated_at: new Date().toISOString() }).eq('id', id)
      return reply.send({ ...data, view_count: current + 1 })
    }
    return reply.send(data)
  })

  app.post('/api/pets', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const cols = await getPetsColumns()
    const userId = getAuthUserId(req)
    if (!userId) return reply.status(401).send({ error: 'unauthorized' })

    const isJson = req.headers['content-type']?.includes('application/json');
    if (isJson) {
      const b = req.body as any;
      const uploadedUrls = b.gallery || (b.image ? [b.image] : []);
      if (uploadedUrls.length === 0) return reply.status(400).send({ error: 'images required' });

      const row: Record<string, any> = {
        user_id: userId,
        name: b.name,
        category: b.category,
        breed: b.breed,
        age_years: b.age_years,
        gender: b.gender,
        province: b.province,
        city: b.city,
        district: b.district,
        description: b.description,
        is_vaccinated: b.is_vaccinated,
        is_neutered: b.is_neutered,
        image: uploadedUrls[0],
        gallery: uploadedUrls,
        status: 'available',
      }
      if (b.latitude !== undefined) row.latitude = b.latitude;
      if (b.longitude !== undefined) row.longitude = b.longitude;
      if (b.personality_tags && (!cols || cols.has('personality_tags'))) row.personality_tags = b.personality_tags;
      if (b.personality_traits && (!cols || cols.has('personality_traits'))) row.personality_traits = b.personality_traits;
      if (b.suitable_for && (!cols || cols.has('suitable_for'))) row.suitable_for = b.suitable_for;

      const { data, error } = await supabase.from('pets').insert(row).select('id').single();
      if (error) return reply.status(500).send({ error: error.message });
      return reply.send({ id: data.id });
    }

    if (!req.isMultipart()) return reply.status(400).send({ error: 'multipart/form-data required' })
    const fields: Record<string, unknown> = {}
    const imageFiles: Array<{ filename: string; mimetype: string; buffer: Buffer }> = []
    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer()
        imageFiles.push({ filename: part.filename || 'upload', mimetype: part.mimetype, buffer })
      } else {
        fields[part.fieldname] = part.value
      }
    }
    if ('id' in fields) delete fields.id
    if (imageFiles.length === 0) return reply.status(400).send({ error: 'images required' })
    if (imageFiles.length > 6) return reply.status(400).send({ error: 'max 6 images' })
    const name = normalizeText(fields.name)
    const category = normalizeText(fields.category)
    if (!name || !category) return reply.status(400).send({ error: 'name and category required' })
    const uploadedUrls: string[] = []
    async function ensureBucket() {
      try {
        if (!supabase) return
        const { error } = await supabase.storage.createBucket('pet-images', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024
        })
        if (error && !/already exists/i.test(error.message)) { }
      } catch { }
    }
    await ensureBucket()
    for (const file of imageFiles) {
      const extMatch = (file.filename || '').match(/\.([a-zA-Z0-9]+)$/)
      const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : ''
      const baseRaw = (file.filename || '').replace(/\.[^/.]+$/, '')
      const asciiBase = baseRaw.normalize('NFKD').replace(/[^\x00-\x7F]/g, '')
      const cleanedBase = asciiBase.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '') || 'image'
      const safeName = `${cleanedBase}${ext || '.jpg'}`
      const path = `${userId}/${Date.now()}_${safeName}`
      let upErr: { message?: string } | null = null
      try {
        const res = await withTimeout(
          supabase.storage.from('pet-images').upload(path, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          }),
          10000
        )
        upErr = res.error
        if (upErr && /Bucket not found/i.test(upErr.message || '')) {
          await ensureBucket()
          const retry = await withTimeout(
            supabase.storage.from('pet-images').upload(path, file.buffer, {
              contentType: file.mimetype,
              upsert: false
            }),
            10000
          )
          upErr = retry.error
        }
      } catch (e) {
        upErr = { message: e instanceof Error ? e.message : 'upload failed' }
      }
      if (upErr) {
        const msg = String(upErr.message || '')
        if (/fetch failed|timeout|Invalid key/i.test(msg)) {
          const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173'
          uploadedUrls.push(`${base}/images/cat-orange.jpg`)
          break
        }
        return reply.status(500).send({ error: upErr.message })
      }
      const { data: pub } = supabase.storage.from('pet-images').getPublicUrl(path)
      if (pub?.publicUrl) uploadedUrls.push(pub.publicUrl)
    }
    const row = {
      user_id: userId,
      name,
      category,
      breed: normalizeText(fields.breed),
      age_years: fields.age_years ? Number(fields.age_years) : null,
      gender: normalizeText(fields.gender),
      province: normalizeText(fields.province),
      city: normalizeText(fields.city),
      district: normalizeText(fields.district),
      description: normalizeText(fields.description),
      is_vaccinated: parseBool(fields.is_vaccinated) ?? false,
      is_neutered: parseBool(fields.is_neutered) ?? false,
      personality_tags: parseStringArray(fields.personality_tags),
      personality_traits: parseStringArray(fields.personality_traits),
      suitable_for: parseStringArray(fields.suitable_for),
      images: uploadedUrls,
      status: 'available',
      latitude: fields.latitude ? Number(fields.latitude) : null,
      longitude: fields.longitude ? Number(fields.longitude) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    let payload = cols
      ? Object.fromEntries(Object.entries(row).filter(([key]) => cols.has(key)))
      : row
    const idInfo = await getPetsIdInfo()
    console.log('pets id column info:', JSON.stringify(idInfo))
    // Fallback: If metadata query fails (idInfo is null) or confirms UUID, generate a UUID.
    // This is safer than relying on database defaults which might be missing.
    if ((!idInfo || idInfo.data_type === 'uuid') && !('id' in payload)) {
      payload = { id: randomUUID(), ...payload }
    }
    if (idInfo?.data_type === 'bigint' && idInfo?.is_identity !== 'YES' && !idInfo?.column_default && !('id' in payload)) {
      return reply.status(500).send({ error: 'pets.id has no default; set identity or default' })
    }
    console.log('pets insert payload:', JSON.stringify(payload))
    let data: any = null
    let error: any = null
    for (let i = 0; i < 5; i++) {
      try {
        const res = (await withTimeout(
          supabase.from('pets').insert(payload).select('id').single(),
          15000
        )) as { data: any; error: any }
        data = res?.data
        error = res?.error
      } catch (e) {
        error = { message: e instanceof Error ? e.message : 'insert failed' }
      }
      if (!error && data) break
      const msg = String(error?.message || '')
      const match = msg.match(/Could not find the '(.+?)' column/)
      if (match) {
        const bad = match[1]
        const next = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== bad))
        if (Object.keys(next).length === Object.keys(payload).length) break
        payload = next
        continue
      }
      break
    }
    if (error || !data) return reply.status(400).send({ error: error?.message || 'insert failed' })
    return reply.send({ id: data.id })
  })

  app.put('/api/pets/:id', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const cols = await getPetsColumns()
    const userId = getAuthUserId(req)
    if (!userId) return reply.status(401).send({ error: 'unauthorized' })
    const id = String((req.params as any).id)
    const { data: existing } = await supabase.from('pets').select('id,user_id').eq('id', id).single()
    if (!existing) return reply.status(404).send({ error: 'Not found' })
    if (existing.user_id !== userId) return reply.status(403).send({ error: 'forbidden' })
    const body = (req.body as any) || {}
    const patch = {
      name: normalizeText(body.name),
      category: normalizeText(body.category),
      breed: normalizeText(body.breed),
      age_years: body.age_years !== undefined ? Number(body.age_years) : null,
      gender: normalizeText(body.gender),
      province: normalizeText(body.province),
      city: normalizeText(body.city),
      district: normalizeText(body.district),
      description: normalizeText(body.description),
      is_vaccinated: parseBool(body.is_vaccinated),
      is_neutered: parseBool(body.is_neutered),
      personality_tags: body.personality_tags ? parseStringArray(body.personality_tags) : undefined,
      personality_traits: body.personality_traits ? parseStringArray(body.personality_traits) : undefined,
      suitable_for: body.suitable_for ? parseStringArray(body.suitable_for) : undefined,
      status: normalizeText(body.status),
      latitude: body.latitude !== undefined ? Number(body.latitude) : undefined,
      longitude: body.longitude !== undefined ? Number(body.longitude) : undefined,
      updated_at: new Date().toISOString()
    }
    const payload = cols
      ? Object.fromEntries(Object.entries(patch).filter(([key, value]) => value !== undefined && cols.has(key)))
      : patch
    const { error } = await supabase.from('pets').update(payload).eq('id', id)
    if (error) return reply.status(400).send({ error: error.message })
    return reply.send({ ok: true })
  })

  app.delete('/api/pets/:id', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const cols = await getPetsColumns()
    const userId = getAuthUserId(req)
    if (!userId) return reply.status(401).send({ error: 'unauthorized' })
    const id = String((req.params as any).id)
    const { data: existing } = await supabase.from('pets').select('id,user_id').eq('id', id).single()
    if (!existing) return reply.status(404).send({ error: 'Not found' })
    if (existing.user_id !== userId) return reply.status(403).send({ error: 'forbidden' })
    if (cols && !cols.has('status')) {
      const { error } = await supabase.from('pets').delete().eq('id', id)
      if (error) return reply.status(400).send({ error: error.message })
      return reply.send({ ok: true })
    }
    const { error } = await supabase.from('pets').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return reply.status(400).send({ error: error.message })
    return reply.send({ ok: true })
  })

  // Nearby pets endpoint
  app.get('/api/pets/nearby', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const { lat, lng, radius = 50, limit = 20 } = req.query as any
    if (!lat || !lng) return reply.status(400).send({ error: 'lat and lng required' })

    const userLat = Number(lat)
    const userLng = Number(lng)
    const maxRadius = Number(radius) // km
    const maxResults = Math.min(Number(limit), 50)

    // Fetch all available pets with coordinates
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('status', 'available')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error) return reply.status(500).send({ error: error.message })
    if (!data || data.length === 0) return reply.send({ data: [], total: 0 })

    // Haversine distance calculation
    function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
      const R = 6371 // km
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    }

    const withDistance = data
      .map(pet => ({
        ...pet,
        distance: haversine(userLat, userLng, pet.latitude, pet.longitude)
      }))
      .filter(pet => pet.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults)

    return reply.send({ data: withDistance, total: withDistance.length })
  })
}
