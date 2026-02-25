import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase.js'
import { randomUUID } from 'crypto'

export async function storiesRoutes(app: FastifyInstance) {
    // Get published stories
    app.get('/api/stories', async (req, reply) => {
        if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
        const { data, error, count } = await supabase
            .from('stories')
            .select('*', { count: 'exact' })
            .eq('status', 'published')
            .order('created_at', { ascending: false })

        if (error) return reply.status(500).send({ error: error.message })
        return reply.send({ data, total: count })
    })

    // Get user's approved adoptions to share story
    app.get('/api/my-adoptions', async (req, reply) => {
        if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
        const userId = (req.query as any)?.user_id
        if (!userId) return reply.status(400).send({ error: 'user_id required' })

        const { data, error } = await supabase
            .from('applications')
            .select('pet_id, pet_name, pet_type')
            .eq('user_id', userId)
            .eq('status', 'approved')

        if (error) return reply.status(500).send({ error: error.message })

        // De-duplicate by pet_id if needed
        const uniqueAdoptions = Array.from(new Map(data.map(item => [item.pet_id, item])).values())
        return reply.send(uniqueAdoptions)
    })

    // Post a new story
    app.post('/api/stories', async (req, reply) => {
        if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })

        const parts = req.parts()
        const payload: any = {
            images: []
        }

        for await (const part of parts) {
            if (part.type === 'file') {
                const buffer = await part.toBuffer()
                const fileName = `${randomUUID()}-${part.filename}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('pets') // Reusing pets bucket for now, or create 'stories' if you prefer
                    .upload(`stories/${fileName}`, buffer, {
                        contentType: part.mimetype,
                        upsert: false
                    })

                if (uploadError) continue

                const { data: { publicUrl } } = supabase.storage
                    .from('pets')
                    .getPublicUrl(`stories/${fileName}`)

                payload.images.push(publicUrl)
            } else {
                payload[part.fieldname] = part.value
            }
        }

        if (!payload.user_id || !payload.title || !payload.content) {
            return reply.status(400).send({ error: 'Missing required fields' })
        }

        const row = {
            user_id: payload.user_id,
            pet_id: payload.pet_id || null,
            pet_name: payload.pet_name || '未知宠物',
            pet_type: payload.pet_type || '其他',
            adopter_name: payload.adopter_name || '爱心人士',
            location: payload.location || '未知',
            title: payload.title,
            content: payload.content,
            full_story: payload.content, // For now full_story is the same as content
            rating: Number(payload.rating || 5),
            images: payload.images,
            avatar: payload.images?.[0] || '/images/default-avatar.jpg', // Use first image as avatar or fallback
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase.from('stories').insert(row).select('*').single()
        if (error) return reply.status(500).send({ error: error.message })

        return reply.send(data)
    })
}
