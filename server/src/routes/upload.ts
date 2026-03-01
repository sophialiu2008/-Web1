import { FastifyInstance } from 'fastify'
import OSS from 'ali-oss'
import { randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'

const accessSecret = process.env.ACCESS_TOKEN_SECRET as string | undefined

function getAuthUserId(req: any): string | null {
    if (!accessSecret) return null
    let token = req.headers?.authorization
    if (token && token.startsWith('Bearer ')) token = token.split(' ')[1]
    if (!token) token = req.cookies?.access_token
    if (!token) return null
    try {
        const decoded = jwt.verify(token, accessSecret) as any
        return decoded?.sub ? String(decoded.sub) : null
    } catch {
        return null
    }
}

export async function uploadRoutes(app: FastifyInstance) {
    app.post('/api/upload', async (req, reply) => {
        const userId = getAuthUserId(req)
        if (!userId) return reply.status(401).send({ error: 'unauthorized' })

        const region = process.env.OSS_REGION
        const bucket = process.env.OSS_BUCKET
        const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID
        const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET

        if (!region || !bucket || !accessKeyId || !accessKeySecret) {
            return reply.status(500).send({ error: '阿里云 OSS 未配置 (OSS_REGION, OSS_BUCKET 等)' })
        }

        let client: OSS;
        try {
            client = new OSS({
                region,
                accessKeyId,
                accessKeySecret,
                bucket
            })
        } catch (err: any) {
            return reply.status(500).send({ error: 'OSS 客户端初始化失败: ' + err.message })
        }

        if (!req.isMultipart()) return reply.status(400).send({ error: '需要 multipart/form-data 格式' })

        const uploadedUrls: string[] = []

        for await (const part of req.parts()) {
            if (part.type === 'file') {
                const buffer = await part.toBuffer()
                const extMatch = (part.filename || '').match(/\.([a-zA-Z0-9]+)$/)
                const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '.jpg'
                const fileName = `${userId}/${Date.now()}_${randomUUID()}${ext}`

                try {
                    const result = await client.put(fileName, buffer)
                    // 确保返回的 URL 基于 HTTPS
                    const url = result.url.replace('http://', 'https://')
                    uploadedUrls.push(url)
                } catch (e: any) {
                    return reply.status(500).send({ error: '文件上传失败: ' + e.message })
                }
            }
        }

        if (uploadedUrls.length === 0) return reply.status(400).send({ error: '未提供任何文件' })
        return reply.send({ urls: uploadedUrls })
    })
}
