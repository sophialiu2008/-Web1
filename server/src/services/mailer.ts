export interface Mailer {
  send(to: string, subject: string, html: string): Promise<void>
}

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
      body: JSON.stringify({
        from: this.from,
        to,
        subject,
        html
      })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Resend API error: ${res.status} ${text}`)
    }
  }
}

class LogMailer implements Mailer {
  async send(to: string, subject: string, html: string) {
    console.log('[MAIL][to=%s][subject=%s] %s', to, subject, html)
  }
}

export function getMailer(): Mailer {
  const driver = process.env.MAIL_DRIVER || 'resend'
  if (driver === 'log') return new LogMailer()
  return new ResendMailer()
}
