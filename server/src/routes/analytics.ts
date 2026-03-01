import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase.js'

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

  // GET notifications for a user
  app.get('/api/notifications', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const userId = (req.query as any)?.user_id
    if (!userId) return reply.status(400).send({ error: 'user_id required' })

    const { data, error } = await supabase.from('analytics_events')
      .select('*')
      .eq('type', 'in_app_notification')
      .eq('id_value', userId)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (error) return reply.status(500).send({ error: error.message })
    return reply.send(data)
  })

  // Mark notification as read
  app.put('/api/notifications/:id/read', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const { id } = req.params as any

    const { data: event, error: fetchErr } = await supabase.from('analytics_events')
      .select('meta')
      .eq('id', id)
      .single()

    if (fetchErr || !event) return reply.status(404).send({ error: 'Notification not found' })

    const meta = { ...event.meta, is_read: true }
    const { error: updateErr } = await supabase.from('analytics_events')
      .update({ meta })
      .eq('id', id)

    if (updateErr) return reply.status(500).send({ error: updateErr.message })
    return reply.send({ success: true })
  })
}
