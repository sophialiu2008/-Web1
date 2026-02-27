import { createRequire } from 'node:module'
import { Config as AliyunConfig } from '@alicloud/openapi-client'

const _require = createRequire(import.meta.url)
// @alicloud/dm20151123 is a CJS package; its constructor is the `.default` export
const _dmPkg = _require('@alicloud/dm20151123')
const DmClient: new (config: AliyunConfig) => any = _dmPkg.default ?? _dmPkg
const SingleSendMailRequest: new (opts: Record<string, unknown>) => any =
  _dmPkg.SingleSendMailRequest

// ─── Mailer interface ────────────────────────────────────────────────────────

export interface Mailer {
  send(to: string, subject: string, html: string): Promise<void>
}

// ─── Resend HTTP driver ──────────────────────────────────────────────────────

class ResendMailer implements Mailer {
  private apiKey: string
  private from: string
  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    const defaultDomain = process.env.MAIL_DOMAIN || 'petsoul.space'
    this.from = process.env.MAIL_FROM || `no-reply@${defaultDomain}`
    if (!apiKey) throw new Error('RESEND_API_KEY not configured')
    this.apiKey = apiKey
  }
  async send(to: string, subject: string, html: string) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: this.from, to, subject, html })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Resend API error: ${res.status} ${text}`)
    }
  }
}

// ─── SMTP driver (nodemailer) ────────────────────────────────────────────────

class SmtpMailer implements Mailer {
  private transporter: any
  private from: string
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require('nodemailer')
    this.from = process.env.MAIL_FROM || 'no-reply@petsoul.space'
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE !== 'false',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }
  async send(to: string, subject: string, html: string) {
    await this.transporter.sendMail({ from: this.from, to, subject, html })
  }
}

// ─── Alibaba Cloud DirectMail driver ─────────────────────────────────────────

class DirectMailer implements Mailer {
  private accountName: string
  private fromAlias: string
  private client: InstanceType<typeof DmClient>

  constructor() {
    const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID
    const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET
    const region = process.env.MAIL_REGION || 'cn-hangzhou'
    this.accountName = process.env.MAIL_ACCOUNT_NAME || ''
    this.fromAlias = process.env.MAIL_FROM_ALIAS || '宠物领养中心'

    if (!accessKeyId || !accessKeySecret) {
      throw new Error('DirectMail: ALIBABA_CLOUD_ACCESS_KEY_ID / ACCESS_KEY_SECRET not configured')
    }
    if (!this.accountName) {
      throw new Error('DirectMail: MAIL_ACCOUNT_NAME not configured')
    }

    const config = new AliyunConfig({
      accessKeyId,
      accessKeySecret,
      // DirectMail uses a unified endpoint (not region-specific)
      endpoint: 'dm.aliyuncs.com'
    })
    this.client = new DmClient(config)
  }

  async send(to: string, subject: string, html: string) {
    const request = new SingleSendMailRequest({
      accountName: this.accountName,
      replyToAddress: true,
      fromAlias: this.fromAlias,
      addressType: 1,
      toAddress: to,
      subject,
      htmlBody: html
    })
    await this.client.singleSendMail(request)
  }
}

// ─── Log driver (dev only) ───────────────────────────────────────────────────

class LogMailer implements Mailer {
  async send(to: string, subject: string, html: string) {
    console.log('[MAIL][to=%s][subject=%s] %s', to, subject, html)
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
// Set MAIL_DRIVER in .env:
//   log        → console only (default for dev)
//   smtp       → nodemailer SMTP
//   resend     → Resend HTTP API
//   directmail → Alibaba Cloud DirectMail

export function getMailer(): Mailer {
  const driver = (process.env.MAIL_DRIVER || 'log').toLowerCase()
  switch (driver) {
    case 'smtp': return new SmtpMailer()
    case 'resend': return new ResendMailer()
    case 'directmail': return new DirectMailer()
    default: return new LogMailer()
  }
}
