import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase.js'
import { sendNotificationSms } from '../utils/sms.js'

export async function adminRoutes(app: FastifyInstance) {
    // Middleware to check if user is admin (simple check for now, can be improved with JWT role verification)
    app.addHook('preHandler', async (req, reply) => {
        // In a real app, we'd verify the JWT role here.
        // For now, we'll assume the client sends the role or we trust the request if it hits /api/admin
        // But let's add a basic check if supabase is available
        if (!supabase) return reply.status(500).send({ error: 'Supabase not configured' })
    })

    // Stats Overview
    app.get('/api/admin/stats', async (req, reply) => {
        const [users, apps, bookings, pets, stories] = await Promise.all([
            supabase!.from('users').select('*', { count: 'exact', head: true }),
            supabase!.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase!.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase!.from('pets').select('*', { count: 'exact', head: true }),
            supabase!.from('stories').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ])

        return {
            totalUsers: users.count || 0,
            pendingApplications: apps.count || 0,
            pendingBookings: bookings.count || 0,
            totalPets: pets.count || 0,
            pendingStories: stories.count || 0
        }
    })

    // User Management
    app.get('/api/admin/users', async (req, reply) => {
        const { page = 1, pageSize = 10, search = '' } = req.query as any
        let query = supabase!.from('users').select('*', { count: 'exact' })

        if (search) {
            query = query.or(`email.ilike.%${search}%,phone.ilike.%${search}%,name.ilike.%${search}%`)
        }

        const { data, error, count } = await query
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (error) {
            console.error('[ADMIN] users query error:', error)
            return reply.status(500).send({ error: error.message })
        }
        return { data: data || [], total: count || 0 }
    })

    app.post('/api/admin/users/:id/status', async (req, reply) => {
        const { id } = req.params as any
        const { status } = req.body as any
        const { error } = await supabase!.from('users').update({ status }).eq('id', id)
        if (error) return reply.status(500).send({ error: error.message })
        return { success: true }
    })

    // Application Management
    app.get('/api/admin/applications', async (req, reply) => {
        const { page = 1, pageSize = 10 } = req.query as any
        const { data, error, count } = await supabase!
            .from('applications')
            .select('*', { count: 'exact' })
            .order('submit_date', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (error) {
            console.error('[ADMIN] applications query error:', error)
            return reply.status(500).send({ error: error.message })
        }
        return { data: data || [], total: count || 0 }
    })

    app.post('/api/admin/applications/:id/review', async (req, reply) => {
        const { id } = req.params as any
        const { status, pet_id, user_id } = req.body as any

        // 1. Update application status
        const updateDate = new Date().toISOString()
        const { error: appError } = await supabase!.from('applications').update({ status, update_date: updateDate }).eq('id', id)
        if (appError) return reply.status(500).send({ error: appError.message })

        if (status === 'approved' && pet_id && user_id) {
            // 2. Update pet status to adopted
            await supabase!.from('pets').update({ status: 'adopted' }).eq('id', pet_id)

            // 3. Create adoption record
            await supabase!.from('adoptions').insert({
                user_id,
                pet_id,
                application_id: id
            })
        }

        // 4. Send Notification SMS and In-App Notification
        try {
            if (status === 'approved' || status === 'rejected') {
                const title = status === 'approved' ? '领养申请通过' : '领养申请被拒绝'
                const message = status === 'approved'
                    ? '您的领养申请已通过审核！请前往个人中心查看详情。'
                    : '很遗憾，您的领养申请未能通过审核。如有疑问请联系客服。'

                await supabase!.from('analytics_events').insert({
                    type: 'in_app_notification',
                    id_value: user_id,
                    timestamp: new Date().toISOString(),
                    meta: { title, message, is_read: false, link: '/profile', type: 'application' }
                })
            }

            const { data: userData } = await supabase!.from('users').select('phone').eq('id', user_id).single()
            if (userData?.phone) {
                if (status === 'approved') {
                    await sendNotificationSms(userData.phone, process.env.ALIBABA_SMS_TEMPLATE_ADOPTION_PASS || 'SMS_ADOPTION_PASS')
                } else if (status === 'rejected') {
                    await sendNotificationSms(userData.phone, process.env.ALIBABA_SMS_TEMPLATE_ADOPTION_REJECT || 'SMS_ADOPTION_REJECT')
                }
            }
        } catch (err) {
            console.error('[ADMIN] Failed to send adoption notification:', err)
        }

        return { success: true }
    })


    // Booking Management
    app.get('/api/admin/bookings', async (req, reply) => {
        const { page = 1, pageSize = 10 } = req.query as any
        const { data, error, count } = await supabase!
            .from('bookings')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (error) return reply.status(500).send({ error: error.message })
        return { data, total: count }
    })

    app.post('/api/admin/bookings/:id/status', async (req, reply) => {
        const { id } = req.params as any
        const { status } = req.body as any

        const { data: booking } = await supabase!.from('bookings').select('*, users(phone)').eq('id', id).single()

        const { error } = await supabase!.from('bookings').update({ status }).eq('id', id)
        if (error) return reply.status(500).send({ error: error.message })

        try {
            const user_id = booking?.user_id || booking?.users?.id
            if (user_id && (status === 'confirmed' || status === 'cancelled')) {
                const title = status === 'confirmed' ? '看宠预约成功' : '预约已被取消'
                const message = status === 'confirmed'
                    ? '您的看宠预约已确认！请按时前往，期待与您见面。'
                    : '很抱歉，您的看宠预约已被取消。请重新预约。'

                await supabase!.from('analytics_events').insert({
                    type: 'in_app_notification',
                    id_value: user_id,
                    timestamp: new Date().toISOString(),
                    meta: { title, message, is_read: false, link: '/profile', type: 'booking' }
                })
            }

            const phone = booking?.users?.phone || booking?.phone
            if (phone) {
                if (status === 'confirmed') {
                    await sendNotificationSms(phone, process.env.ALIBABA_SMS_TEMPLATE_BOOKING_CONFIRM || 'SMS_BOOKING_CONFIRM')
                } else if (status === 'cancelled') {
                    await sendNotificationSms(phone, process.env.ALIBABA_SMS_TEMPLATE_BOOKING_CANCEL || 'SMS_BOOKING_CANCEL')
                }
            }
        } catch (err) {
            console.error('[ADMIN] Failed to send booking notification:', err)
        }

        return { success: true }
    })

    // Pet Management
    app.get('/api/admin/pets', async (req, reply) => {
        const { page = 1, pageSize = 10 } = req.query as any
        const { data, error, count } = await supabase!
            .from('pets')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (error) return reply.status(500).send({ error: error.message })
        return { data, total: count }
    })

    // Story Moderation
    app.get('/api/admin/stories', async (req, reply) => {
        const { page = 1, pageSize = 10 } = req.query as any
        const { data, error, count } = await supabase!
            .from('stories')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (error) return reply.status(500).send({ error: error.message })
        return { data, total: count }
    })

    app.post('/api/admin/stories/:id/status', async (req, reply) => {
        const { id } = req.params as any
        const { status } = req.body as any
        const { error } = await supabase!.from('stories').update({ status }).eq('id', id)
        if (error) return reply.status(500).send({ error: error.message })
        return { success: true }
    })
}
