import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import formbody from '@fastify/formbody'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import { petsRoutes } from './routes/pets.js'
import { blogsRoutes } from './routes/blogs.js'
import { applicationsRoutes } from './routes/applications.js'
import { bookingsRoutes } from './routes/bookings.js'
import { analyticsRoutes } from './routes/analytics.js'
import { authRoutes } from './routes/auth.js'
import { storiesRoutes } from './routes/stories.js'
import { adminRoutes } from './routes/admin.js'
import { chatRoutes } from './routes/chat.js'
import { favoritesRoutes } from './routes/favorites.js'
import { uploadRoutes } from './routes/upload.js'
import { publicStatsRoutes } from './routes/stats.js'
import { startCronJobs } from './utils/cron.js'

const app = Fastify({ logger: true })

startCronJobs()


await app.register(cors, { origin: true, credentials: true })
await app.register(formbody)
await app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024, files: 6 }
})
await app.register(cookie, {
  secret: process.env.COOKIE_SECRET || undefined,
  hook: 'onRequest'
})

app.get('/api/health', async () => ({ ok: true }))
await petsRoutes(app)
await blogsRoutes(app)
await applicationsRoutes(app)
await bookingsRoutes(app)
await analyticsRoutes(app)
await authRoutes(app)
await storiesRoutes(app)
await adminRoutes(app)
await chatRoutes(app)
await favoritesRoutes(app)
await uploadRoutes(app)
await publicStatsRoutes(app)

const port = Number(process.env.PORT || 8787)
const host = process.env.HOST || '0.0.0.0'
app.listen({ port, host }).then(() => {
  console.log(`Server listening on http://${host}:${port}`)
})
