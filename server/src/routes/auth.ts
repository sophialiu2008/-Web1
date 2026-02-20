import { FastifyInstance } from 'fastify'
import { supabase } from '../supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import svgCaptcha from 'svg-captcha'
import { getMailer } from '../services/mailer'
import { getClientIp, rateLimit } from '../utils/rateLimit'
import { randomBytes, randomUUID } from 'node:crypto'

const ACCESS_TTL = 60 * 15
const REFRESH_TTL = 60 * 60 * 24 * 7
const SALT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12)
const memUsers = new Map<string, { id: string; email: string; password_hash: string; email_verified_at: string | null; failed_attempts?: number; locked_until?: string | null }>()
const captchaMem = new Map<string, { answer: string; exp: number }>()

const secrets = {
  access: process.env.ACCESS_TOKEN_SECRET as string,
  refresh: process.env.REFRESH_TOKEN_SECRET as string
}

const strongPwd = (pwd: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd)

function setAuthCookies(reply: any, accessToken: string, refreshToken: string) {
  const domain = process.env.COOKIE_DOMAIN || undefined
  const secure = process.env.COOKIE_SECURE !== 'false'
  const common = { httpOnly: true, sameSite: 'strict' as const, secure, domain, path: '/' }
  reply.setCookie('access_token', accessToken, { ...common, maxAge: ACCESS_TTL })
  reply.setCookie('refresh_token', refreshToken, { ...common, maxAge: REFRESH_TTL })
}

async function sendVerificationEmail(email: string, code: string) {
  const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173'
  const link = `${base}/verify-email?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`
  const html = `<p>您的验证码为：<b>${code}</b>（10分钟内有效）</p><p>或点击链接完成验证：<a href="${link}">${link}</a></p>`
  await getMailer().send(email, '邮箱验证', html)
}

async function sendResetLink(email: string, token: string) {
  const base = process.env.FRONTEND_BASE_URL || 'http://localhost:5173'
  const link = `${base}/reset-password?token=${encodeURIComponent(token)}`
  const html = `<p>请点击以下链接重置密码（1小时内有效）：</p><p><a href="${link}">${link}</a></p>`
  await getMailer().send(email, '重置密码', html)
}

async function logAudit(event: string, params: { user_id?: string | null, email?: string | null, ip?: string, ua?: string, detail?: any }) {
  if (!supabase) return
  await supabase.from('audit_logs').insert({
    event_type: event,
    user_id: params.user_id || null,
    email: params.email || null,
    ip: params.ip || null,
    user_agent: params.ua || null,
    detail: params.detail || null
  })
}

export async function authRoutes(app: FastifyInstance) {
  // Email uniqueness check endpoint
  app.get('/v1/auth/check-email', async (req, reply) => {
    const ip = getClientIp(req)
    if (!rateLimit(`chkemail:${ip}`, 60, 60 * 60 * 1000)) return reply.status(429).send({ code: 10429, msg: 'Too many requests' })
    const email = String((req.query as any)?.email || '').trim().toLowerCase()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.send({ code: 0, exists: false })
    }
    // Check Supabase users table
    if (supabase) {
      const { data } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
      if (data) return reply.send({ code: 0, exists: true })
    }
    // Check in-memory fallback
    if (memUsers.has(email)) return reply.send({ code: 0, exists: true })
    return reply.send({ code: 0, exists: false })
  })

  app.get('/v1/auth/captcha', async (_req, reply) => {
    const c = svgCaptcha.create({ size: 5, noise: 2, width: 120, height: 44, background: '#f6f7f9' })
    const id = Math.random().toString(36).slice(2)
    if (supabase) {
      const { error } = await supabase.from('auth_captchas').upsert({
        id, answer: c.text.toLowerCase(), expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      })
      if (error) {
        captchaMem.set(id, { answer: c.text.toLowerCase(), exp: Date.now() + 5 * 60 * 1000 })
      }
    } else {
      captchaMem.set(id, { answer: c.text.toLowerCase(), exp: Date.now() + 5 * 60 * 1000 })
    }
    return reply.send({ code: 0, msg: 'success', data: { id, svg: c.data } })
  })

  app.post('/v1/auth/register', async (req, reply) => {
    const ip = getClientIp(req)
    if (!rateLimit(`reg:${ip}`, 60, 60 * 60 * 1000)) return reply.status(429).send({ code: 10429, msg: 'Too many requests' })
    const b = req.body as any
    const email = String(b?.email || '').trim().toLowerCase()
    const password = String(b?.password || '')
    const captchaId = String(b?.captcha_id || '')
    const captchaAns = String(b?.captcha_answer || '').trim().toLowerCase()
    if (!email || !password || !captchaId || !captchaAns) return reply.send({ code: 10003, msg: '参数不合法' })
    if (!strongPwd(password)) return reply.send({ code: 10004, msg: '密码不符合强度要求' })
    // captcha verify with fallback
    if (supabase) {
      const { data: cap, error } = await supabase.from('auth_captchas').select('*').eq('id', captchaId).maybeSingle()
      if (error) {
        const rec = captchaMem.get(captchaId)
        if (!rec || rec.exp < Date.now() || rec.answer !== captchaAns) return reply.send({ code: 10005, msg: '图形验证码错误' })
        captchaMem.delete(captchaId)
      } else {
        if (!cap || new Date(cap.expires_at).getTime() < Date.now() || cap.answer !== captchaAns) return reply.send({ code: 10005, msg: '图形验证码错误' })
      }
    } else {
      const rec = captchaMem.get(captchaId)
      if (!rec || rec.exp < Date.now() || rec.answer !== captchaAns) return reply.send({ code: 10005, msg: '图形验证码错误' })
      captchaMem.delete(captchaId)
    }
    if (supabase) {
      const { data: existed } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
      if (existed) return reply.send({ code: 10008, msg: '邮箱已注册' })
      const hash = await bcrypt.hash(password, SALT_ROUNDS)
      const { data: user, error } = await supabase.from('users').insert({
        email,
        password_hash: hash,
        email_verified_at: new Date().toISOString()
      }).select('id,email').single()
      if (!error && user) {
        const accessToken = jwt.sign({ sub: user.id }, secrets.access, { expiresIn: ACCESS_TTL })
        const refreshToken = jwt.sign({ sub: user.id }, secrets.refresh, { expiresIn: REFRESH_TTL })
        try {
          await supabase.from('sessions').insert({
            user_id: user.id,
            refresh_token: refreshToken,
            expires_at: new Date(Date.now() + REFRESH_TTL * 1000).toISOString(),
          })
        } catch { }
        setAuthCookies(reply, accessToken, refreshToken)
        await logAudit('register_direct', { user_id: user.id, email, ip, ua: req.headers['user-agent'] as string })
        return reply.send({ code: 0, msg: 'success', data: { user, access_token: accessToken, refresh_token: refreshToken, expires_in: ACCESS_TTL } })
      }
      // fallthrough to memory on error
    }
    if (memUsers.has(email)) return reply.send({ code: 10008, msg: '邮箱已注册' })
    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    const id = randomUUID()
    const user = { id, email, password_hash: hash, email_verified_at: new Date().toISOString(), failed_attempts: 0, locked_until: null }
    memUsers.set(email, user)
    const accessToken = jwt.sign({ sub: id }, secrets.access, { expiresIn: ACCESS_TTL })
    const refreshToken = jwt.sign({ sub: id }, secrets.refresh, { expiresIn: REFRESH_TTL })
    setAuthCookies(reply, accessToken, refreshToken)
    return reply.send({ code: 0, msg: 'success', data: { user: { id, email }, access_token: accessToken, refresh_token: refreshToken, expires_in: ACCESS_TTL } })
  })

  app.post('/v1/auth/verify-email', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ code: 10002, msg: 'server error' })
    const ip = getClientIp(req)
    const b = req.body as any
    const email = String(b?.email || '').trim().toLowerCase()
    const code = String(b?.code || '')
    if (!email || !code) return reply.send({ code: 10003, msg: '参数不合法' })
    const { data: rec } = await supabase.from('email_verification_codes').select('*').eq('email', email).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!rec || rec.code !== code || new Date(rec.expires_at).getTime() < Date.now()) return reply.send({ code: 10007, msg: '验证码无效或已过期' })
    const { data: pending } = await supabase.from('pending_registrations').select('*').eq('email', email).maybeSingle()
    if (!pending) return reply.send({ code: 10003, msg: '参数不合法' })
    const { data: existed } = await supabase.from('users').select('id').eq('email', email).maybeSingle()
    if (existed) return reply.send({ code: 10008, msg: '邮箱已注册' })
    const { data: user, error } = await supabase.from('users').insert({
      email,
      password_hash: pending.password_hash,
      email_verified_at: new Date().toISOString()
    }).select('id,email').single()
    if (error || !user) return reply.status(500).send({ code: 10002, msg: 'server error' })
    await supabase.from('pending_registrations').delete().eq('email', email)
    await logAudit('register_verify', { user_id: user.id, email, ip, ua: req.headers['user-agent'] as string })
    return reply.send({ code: 0, msg: 'success' })
  })

  app.post('/v1/auth/login', async (req, reply) => {
    const ip = getClientIp(req)
    if (!rateLimit(`login:${ip}`, 120, 60 * 60 * 1000)) return reply.status(429).send({ code: 10429, msg: 'Too many requests' })
    const b = req.body as any
    const email = String(b?.email || '').trim().toLowerCase()
    const password = String(b?.password || '')
    if (!email || !password) return reply.send({ code: 10003, msg: '参数不合法' })
    let user: any = null
    if (supabase) {
      const q = await supabase.from('users').select('*').eq('email', email).maybeSingle()
      user = q?.data || null
    }
    if (!user) {
      const m = memUsers.get(email)
      if (m) {
        const okm = await bcrypt.compare(password, m.password_hash)
        if (!okm) return reply.send({ code: 10010, msg: '邮箱或密码错误' })
        const accessToken = jwt.sign({ sub: m.id }, secrets.access, { expiresIn: ACCESS_TTL })
        const refreshToken = jwt.sign({ sub: m.id }, secrets.refresh, { expiresIn: REFRESH_TTL })
        setAuthCookies(reply, accessToken, refreshToken)
        return reply.send({ code: 0, msg: 'success', data: { user: { id: m.id, email: m.email }, access_token: accessToken, refresh_token: refreshToken, expires_in: ACCESS_TTL } })
      }
      await logAudit('login_failed', { email, ip, ua: req.headers['user-agent'] as string, detail: { reason: 'user_not_found' } })
      return reply.send({ code: 10010, msg: '邮箱或密码错误' })
    }
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
      return reply.send({ code: 10009, msg: '账号已锁定，请稍后重试' })
    }
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      const fails = (user.failed_attempts || 0) + 1
      const locked_until = fails >= 5 ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null
      await supabase!.from('users').update({ failed_attempts: fails, locked_until }).eq('id', user.id)
      await logAudit('login_failed', { user_id: user.id, email, ip, ua: req.headers['user-agent'] as string, detail: { reason: 'wrong_password', fails } })
      return reply.send({ code: 10010, msg: '邮箱或密码错误' })
    }
    await supabase!.from('users').update({ failed_attempts: 0, locked_until: null, updated_at: new Date().toISOString() }).eq('id', user.id)
    const accessToken = jwt.sign({ sub: user.id }, secrets.access, { expiresIn: ACCESS_TTL })
    const refreshToken = jwt.sign({ sub: user.id }, secrets.refresh, { expiresIn: REFRESH_TTL })
    await supabase!.from('sessions').insert({
      user_id: user.id,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + REFRESH_TTL * 1000).toISOString(),
    })
    setAuthCookies(reply, accessToken, refreshToken)
    await logAudit('login_success', { user_id: user.id, email, ip, ua: req.headers['user-agent'] as string })
    return reply.send({ code: 0, msg: 'success', data: { user: { id: user.id, email: user.email }, access_token: accessToken, refresh_token: refreshToken, expires_in: ACCESS_TTL } })
  })

  app.post('/v1/auth/refresh-token', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ code: 10002, msg: 'server error' })
    const token = (req.cookies?.refresh_token as string | undefined) || ''
    if (!token) return reply.send({ code: 10011, msg: '无效的刷新凭证' })
    try {
      const decoded = jwt.verify(token, secrets.refresh) as any
      const userId = decoded.sub as string
      const { data: session } = await supabase.from('sessions').select('*').eq('refresh_token', token).maybeSingle()
      if (!session || session.used || new Date(session.expires_at).getTime() < Date.now()) return reply.send({ code: 10011, msg: '无效的刷新凭证' })
      const accessToken = jwt.sign({ sub: userId }, secrets.access, { expiresIn: ACCESS_TTL })
      const newRefresh = jwt.sign({ sub: userId }, secrets.refresh, { expiresIn: REFRESH_TTL })
      await supabase.from('sessions').update({ used: true }).eq('id', session.id)
      await supabase.from('sessions').insert({
        user_id: userId,
        refresh_token: newRefresh,
        expires_at: new Date(Date.now() + REFRESH_TTL * 1000).toISOString(),
      })
      setAuthCookies(reply, accessToken, newRefresh)
      return reply.send({ code: 0, msg: 'success', data: { access_token: accessToken, refresh_token: newRefresh, expires_in: ACCESS_TTL } })
    } catch {
      return reply.send({ code: 10011, msg: '无效的刷新凭证' })
    }
  })

  // Diagnostic: test SMTP connectivity
  app.get('/v1/auth/test-mail', async (req, reply) => {
    const email = String((req.query as any)?.email || '').trim()
    if (!email) return reply.send({ ok: false, error: 'provide ?email=xxx' })
    try {
      await getMailer().send(email, '测试邮件 - 宠物领养中心', '<p>如果你收到这封邮件，说明 SMTP 配置正确！</p>')
      return reply.send({ ok: true, msg: `test email sent to ${email}` })
    } catch (e: any) {
      console.error('[TEST-MAIL] SMTP Error:', e)
      return reply.send({ ok: false, error: e?.message || String(e) })
    }
  })

  app.post('/v1/auth/password/forgot', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ code: 10002, msg: 'server error' })
    const ip = getClientIp(req)
    const b = req.body as any
    const email = String(b?.email || '').trim().toLowerCase()
    if (!email) return reply.send({ code: 10003, msg: '参数不合法' })
    const { data: user } = await supabase.from('users').select('id,email').eq('email', email).maybeSingle()
    if (!user) {
      console.log('[FORGOT] email not found in users table:', email)
      return reply.send({ code: 0, msg: 'success' })
    }
    const token = randomBytes(32).toString('base64url')
    await supabase.from('password_reset_tokens').insert({
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    })
    try {
      await sendResetLink(email, token)
      console.log('[FORGOT] reset email sent to:', email)
    } catch (e: any) {
      console.error('[FORGOT] SMTP Error sending reset email:', e)
      return reply.status(500).send({ code: 10002, msg: '邮件发送失败，请稍后重试' })
    }
    await logAudit('password_forgot', { user_id: user.id, email, ip, ua: req.headers['user-agent'] as string })
    return reply.send({ code: 0, msg: 'success' })
  })

  app.post('/v1/auth/password/reset', async (req, reply) => {
    if (!supabase) return reply.status(500).send({ code: 10002, msg: 'server error' })
    const b = req.body as any
    const token = String(b?.token || '')
    const newPassword = String(b?.new_password || '')
    if (!token || !newPassword) return reply.send({ code: 10003, msg: '参数不合法' })
    if (!strongPwd(newPassword)) return reply.send({ code: 10004, msg: '密码不符合强度要求' })
    const { data: rec } = await supabase.from('password_reset_tokens').select('*').eq('token', token).maybeSingle()
    if (!rec || rec.used || new Date(rec.expires_at).getTime() < Date.now()) return reply.send({ code: 10011, msg: '链接无效或已过期' })
    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await supabase.from('users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('id', rec.user_id)
    await supabase.from('sessions').delete().eq('user_id', rec.user_id)
    await supabase.from('password_reset_tokens').update({ used: true }).eq('id', rec.id)
    await logAudit('password_reset', { user_id: rec.user_id })
    return reply.send({ code: 0, msg: 'success' })
  })
}
