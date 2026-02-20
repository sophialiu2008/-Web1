import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase'

export async function petsRoutes(app: FastifyInstance) {
  app.get('/api/pets', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const q = (req.query as any)?.q as string | undefined
    const type = (req.query as any)?.type as string | undefined
    const breed = (req.query as any)?.breed as string | undefined
    const location = (req.query as any)?.location as string | undefined
    let query = supabase.from('pets').select('*')
    if (type && type !== 'all') query = query.eq('type', type)
    if (breed) query = query.ilike('breed', `%${breed}%`)
    if (location) query = query.ilike('location', `%${location}%`)
    if (q) {
      query = query.or(`name.ilike.%${q}%,breed.ilike.%${q}%,location.ilike.%${q}%`)
    }
    const { data, error } = await query
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send(data)
  })

  app.get('/api/pets/:id', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const id = Number((req.params as any).id)
    const { data, error } = await supabase.from('pets').select('*').eq('id', id).single()
    if (error) return reply.status(404).send({ error: 'Not found' })
    return reply.send(data)
  })
}
