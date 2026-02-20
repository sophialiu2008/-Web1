import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase'

export async function analyticsRoutes(app: FastifyInstance) {
  app.post('/api/analytics/pet-view', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const body = req.body as any
    const id = Number(body.pet_id)
    const { data, error } = await supabase.rpc('increment_pet_views', { pet_id_input: id })
    if (error) return reply.status(400).send({ error: error.message })
    return reply.send({ ok: true })
  })

  app.post('/api/analytics/event', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const body = req.body as any
    const { error } = await supabase.from('analytics_events').insert({
      type: body.type,
      id_value: body.id || null,
      timestamp: new Date().toISOString(),
      meta: body.meta || null
    })
    if (error) return reply.status(400).send({ error: error.message })
    return reply.send({ ok: true })
  })
}
