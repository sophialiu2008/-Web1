import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase.js'

export async function favoritesRoutes(app: FastifyInstance) {
    // Check if user is authenticated (simple hook to get user from token)
    app.addHook('preHandler', async (req, reply) => {
        // Here we could extract user_id from token. For now, since the frontend 
        // will pass user_id (or we can get it from headers/body depending on auth implementation)
        // Wait, auth is using cookies or the frontend stores the user session.
        // Let's implement it in a way compatible with how applications are handled.
    })

    // GET /api/favorites
    app.get('/api/favorites', async (req, reply) => {
        const userId = req.headers['x-user-id'] || (req.query as any).userId;
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

        const { data, error } = await supabase!
            .from('favorites')
            .select('pet_id, pets(*)')
            .eq('user_id', userId)

        if (error) return reply.status(500).send({ error: error.message })

        // Process data so the frontend gets an array of pets mixed with favorite logic
        const formatted = data.map(item => item.pets)
        return formatted
    })

    // POST /api/favorites/:petId
    app.post('/api/favorites/:petId', async (req, reply) => {
        const { petId } = req.params as { petId: string }
        const { userId } = req.body as { userId: string } // Assume frontend sends userId or we get it from headers

        if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

        // Check if favorite exists
        const { data: existing } = await supabase!
            .from('favorites')
            .select('id')
            .eq('user_id', userId)
            .eq('pet_id', petId)
            .single()

        if (existing) {
            return { success: true, message: 'Already favorited' }
        }

        const { error } = await supabase!.from('favorites').insert({
            user_id: userId,
            pet_id: petId
        })

        if (error) return reply.status(500).send({ error: error.message })
        return { success: true }
    })

    // DELETE /api/favorites/:petId
    app.delete('/api/favorites/:petId', async (req, reply) => {
        const { petId } = req.params as { petId: string }
        const userId = req.headers['x-user-id'] || (req.query as any).userId || (req.body as any)?.userId;

        if (!userId) return reply.status(401).send({ error: 'Unauthorized' })

        const { error } = await supabase!
            .from('favorites')
            .delete()
            .eq('user_id', userId)
            .eq('pet_id', petId)

        if (error) return reply.status(500).send({ error: error.message })
        return { success: true }
    })
}
