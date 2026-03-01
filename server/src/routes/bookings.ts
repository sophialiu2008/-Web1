import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase.js'

export async function bookingsRoutes(app: FastifyInstance) {
  app.get('/api/bookings', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const userId = (req.query as any)?.user_id as string | undefined
    let query = supabase.from('bookings').select('*').order('date', { ascending: false })
    if (userId) query = query.eq('user_id', userId)
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send(data)
  })

  app.post('/api/bookings', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const body = req.body as any
    const { data, error } = await supabase.from('bookings').insert({
      user_id: body.user_id,
      pet_id: body.pet_id,
      pet_name: body.pet_name,
      date: body.date,
      time: body.time,
      status: 'pending',
      created_at: new Date().toISOString()
    }).select('*').single()
    if (error) return reply.status(400).send({ error: error.message })
    return reply.send(data)
  })

  app.put('/api/bookings/:id/cancel', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const { id } = req.params as { id: string }

    // The requirement says only cancel > 24 hours. The frontend checks it, let's also enforce it here if we want.
    const { data: booking } = await supabase.from('bookings').select('date, time').eq('id', id).single()
    if (booking) {
      const bookingDate = new Date(`${booking.date}T${booking.time}`);
      const diffHours = (bookingDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffHours < 24) {
        return reply.status(400).send({ error: '预约时间不足24小时，无法取消' })
      }
    }

    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    if (error) return reply.status(500).send({ error: error.message })
    return { success: true }
  })
}
