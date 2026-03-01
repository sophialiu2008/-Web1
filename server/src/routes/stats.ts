import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase.js'

export async function publicStatsRoutes(app: FastifyInstance) {
    app.get('/api/public/stats', async (req, reply) => {
        try {
            if (!supabase) {
                return reply.status(500).send({ error: 'Supabase client not initialized' })
            }

            const [petsCount, storiesCount, successfulAdoptionsCount] = await Promise.all([
                supabase.from('pets').select('*', { count: 'exact', head: true }),
                supabase.from('stories').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
                supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['approved', 'completed'])
            ])

            return {
                successfulAdoptions: successfulAdoptionsCount.count || 0,
                totalPets: petsCount.count || 0,
                totalStories: storiesCount.count || 0,
                satisfactionRate: 98 // Static for now, could be dynamic later if there are reviews
            }
        } catch (error: any) {
            console.error('[PUBLIC STATS] Error fetching stats:', error)
            return reply.status(500).send({ error: 'Failed to fetch public stats' })
        }
    })
}
