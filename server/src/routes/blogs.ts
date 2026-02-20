import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase'

export async function blogsRoutes(app: FastifyInstance) {
  app.get('/api/blog', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const { data, error } = await supabase.from('blog_posts').select('*').order('publish_date', { ascending: false })
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send(data)
  })

  app.get('/api/blog/:id', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    const id = (req.params as any).id
    const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single()
    if (error) return reply.status(404).send({ error: 'Not found' })
    return reply.send(data)
  })
}
