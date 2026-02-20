import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase'

export async function applicationsRoutes(app: FastifyInstance) {
  app.get('/api/applications', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const userId = (req.query as any)?.user_id as string | undefined
    let query = supabase.from('applications').select('*').order('submit_date', { ascending: false })
    if (userId) query = query.eq('user_id', userId)
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send(data)
  })

  app.post('/api/applications', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const body = req.body as any
    try {
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!body?.user_id || typeof body.user_id !== 'string' || !uuidRe.test(body.user_id)) {
        return reply.status(400).send({ error: 'invalid user_id, must be a UUID v4' })
      }
      if (body.age !== null && body.age !== undefined) {
        const ageNum = Number(body.age)
        if (!Number.isFinite(ageNum)) {
          return reply.status(400).send({ error: 'invalid age, must be a number' })
        }
        body.age = ageNum
      }
      const row = {
        user_id: body.user_id,
        pet_id: body.pet_id ?? null,
        pet_name: body.pet_name ?? null,
        name: body.name ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        age: body.age ?? null,
        occupation: body.occupation ?? null,
        housing_type: body.housing_type ?? null,
        has_yard: body.has_yard ?? null,
        pet_type: body.pet_type ?? null,
        experience: body.experience ?? null,
        current_pets: body.current_pets ?? null,
        family_members: body.family_members ?? null,
        reason: body.reason ?? null,
        status: 'pending',
        submit_date: new Date().toISOString(),
        update_date: new Date().toISOString()
      }
      const { data, error } = await supabase.from('applications').insert(row).select('*').single()
      if (error) {
        const supErr = error as any
        const code = supErr?.code as string | undefined
        let message = supErr?.message as string | undefined
        if (code === '42P01' || /relation .* does not exist/i.test(message || '')) {
          message = 'applications table not found; please run server/supabase/schema.sql in Supabase SQL Editor'
        } else if (/row-level security/i.test(message || '') || /permission denied/i.test(message || '') || code === 'PGRST302') {
          message = 'RLS blocked insert; set SUPABASE_SERVICE_ROLE_KEY in server/.env or disable RLS on applications (dev only)'
        }
        return reply.status(400).send({ error: message || 'database error', details: supErr?.details, code })
      }
      return reply.send(data)
    } catch (e: any) {
      return reply.status(500).send({ error: e?.message || 'internal error' })
    }
  })
}
