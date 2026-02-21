/**
 * 阿里云短信服务封装
 *
 * 需要在 .env 中配置:
 *   ALIBABA_SMS_ACCESS_KEY_ID     — 阿里云 AccessKey ID
 *   ALIBABA_SMS_ACCESS_KEY_SECRET — 阿里云 AccessKey Secret
 *   ALIBABA_SMS_SIGN_NAME         — 短信签名（如"宠物领养中心"）
 *   ALIBABA_SMS_TEMPLATE_CODE     — 验证码模板 Code
 */

import Dysmsapi from '@alicloud/dysmsapi20170525'
import OpenApi from '@alicloud/openapi-client'
import Util from '@alicloud/tea-util'

// ESM/CJS interop: handle both default and namespace exports
const DysmsapiClient = (Dysmsapi as any).default || Dysmsapi
const OpenApiConfig = (OpenApi as any).default?.Config || (OpenApi as any).Config || OpenApi
const RuntimeOptions = (Util as any).default?.RuntimeOptions || (Util as any).RuntimeOptions || Util

// ─── OTP 存储（内存） ────────────────────────────────────────────
interface OtpRecord {
    code: string
    exp: number
    attempts: number
}

const otpStore = new Map<string, OtpRecord>()

// 每 5 分钟清理过期记录
setInterval(() => {
    const now = Date.now()
    for (const [k, v] of otpStore) {
        if (v.exp < now) otpStore.delete(k)
    }
}, 5 * 60 * 1000)

// ─── 生成 6 位数字验证码 ─────────────────────────────────────────
function generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000))
}

// ─── 格式化手机号为 E.164 ────────────────────────────────────────
export function normalizePhone(phone: string): string {
    const digits = phone.replace(/[^\d+]/g, '')
    if (digits.startsWith('+')) return digits
    if (digits.startsWith('86')) return '+' + digits
    return '+86' + digits
}

// ─── 创建阿里云 SMS 客户端 ───────────────────────────────────────
function createSmsClient() {
    const accessKeyId = process.env.ALIBABA_SMS_ACCESS_KEY_ID
    const accessKeySecret = process.env.ALIBABA_SMS_ACCESS_KEY_SECRET
    if (!accessKeyId || !accessKeySecret) {
        throw new Error('阿里云短信服务未配置，请检查 .env 中的 ALIBABA_SMS_* 变量')
    }
    const config = new OpenApiConfig({
        accessKeyId,
        accessKeySecret,
    })
    config.endpoint = 'dysmsapi.aliyuncs.com'
    return new DysmsapiClient(config)
}

// ─── 发送短信验证码 ──────────────────────────────────────────────
export async function sendSmsOtp(phone: string): Promise<void> {
    const code = generateOtp()
    const ttl = 5 * 60 * 1000 // 5 分钟有效

    // 存储 OTP
    otpStore.set(phone, { code, exp: Date.now() + ttl, attempts: 0 })

    // 如果 SMS 驱动设为 log，仅控制台输出（开发用）
    if (process.env.SMS_DRIVER === 'log') {
        console.log(`[SMS][to=${phone}] 验证码: ${code}`)
        return
    }

    const signName = process.env.ALIBABA_SMS_SIGN_NAME
    const templateCode = process.env.ALIBABA_SMS_TEMPLATE_CODE
    if (!signName || !templateCode) {
        throw new Error('阿里云短信签名或模板未配置')
    }

    // 阿里云 SendSms 需要不带 +86 前缀的国内手机号
    const phoneNumber = phone.replace(/^\+86/, '')

    const client = createSmsClient()
    const SendSmsRequest = (Dysmsapi as any).default?.SendSmsRequest || (Dysmsapi as any).SendSmsRequest
    const request = new SendSmsRequest({
        phoneNumbers: phoneNumber,
        signName,
        templateCode,
        templateParam: JSON.stringify({ code }),
    })
    const runtime = new RuntimeOptions({})

    console.log('[SMS] Sending to:', phoneNumber, '| Sign:', signName, '| Template:', templateCode, '| Param:', JSON.stringify({ code }))

    const resp = await client.sendSmsWithOptions(request, runtime)

    // 打印完整响应用于调试
    console.log('[SMS] Alibaba API response:', JSON.stringify(resp.body, null, 2))

    if (resp.body?.code !== 'OK') {
        console.error('[SMS] Alibaba send failed! Code:', resp.body?.code, '| Message:', resp.body?.message)
        throw new Error(resp.body?.message || `短信发送失败 (${resp.body?.code})`)
    }

    console.log('[SMS] Success! BizId:', resp.body?.bizId)
}

// ─── 校验短信验证码 ──────────────────────────────────────────────
export function verifySmsOtp(phone: string, code: string): boolean {
    const record = otpStore.get(phone)
    if (!record) return false
    if (record.exp < Date.now()) {
        otpStore.delete(phone)
        return false
    }
    if (record.attempts >= 5) {
        otpStore.delete(phone)
        return false
    }
    record.attempts++
    if (record.code !== code) return false
    otpStore.delete(phone)
    return true
}
