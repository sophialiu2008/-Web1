import nodemailer from 'nodemailer'

export interface Mailer {
  send(to: string, subject: string, html: string): Promise<void>
}

class SmtpMailer implements Mailer {
  private transporter
  private from: string
  constructor() {
    const host = process.env.SMTP_HOST
    const port = Number(process.env.SMTP_PORT || 587)
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const secure = process.env.SMTP_SECURE === 'true'
    this.from = process.env.MAIL_FROM || user || 'no-reply@example.com'
    if (!host || !user || !pass) throw new Error('SMTP not configured')
    this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
  }
  async send(to: string, subject: string, html: string) {
    await this.transporter.sendMail({ from: this.from, to, subject, html })
  }
}

class LogMailer implements Mailer {
  async send(to: string, subject: string, html: string) {
    console.log('[MAIL][to=%s][subject=%s] %s', to, subject, html)
  }
}

export function getMailer(): Mailer {
  const driver = process.env.MAIL_DRIVER || 'smtp'
  if (driver === 'log') return new LogMailer()
  return new SmtpMailer()
}

