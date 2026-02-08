import { NextResponse } from 'next/server'
import { createWhatsAppService } from '@/lib/whatsapp/api'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { channel, to, subject, content, message } = body

    if (!channel || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (channel === 'email') {
      const smtpUser = process.env.EMAIL_SMTP_USER
      const smtpPass = process.env.EMAIL_SMTP_PASS

      if (smtpUser && smtpPass) {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.default.createTransport({
          host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
          secure: false,
          auth: { user: smtpUser, pass: smtpPass },
        })

        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'noreply@primafacie.com',
          to,
          subject: subject || 'Nova notificacao',
          text: content || '',
          html: `<p>${content || ''}</p>`,
        })
      } else {
        console.log('EMAIL NOTIFICATION (SMTP not configured):', { to, subject, content })
      }

      return NextResponse.json({ success: true })
    }

    if (channel === 'whatsapp') {
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

      if (!accessToken || !phoneNumberId) {
        console.log('WHATSAPP NOTIFICATION (not configured):', { to, message })
        return NextResponse.json({ success: true })
      }

      const whatsapp = createWhatsAppService({
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
        phoneNumberId,
        accessToken,
        webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
        apiVersion: process.env.WHATSAPP_API_VERSION || '18.0',
      })

      const result = await whatsapp.sendTextMessage(to, message || content || '')

      if (!result.success) {
        console.error('WhatsApp send failed:', result.error)
      }

      return NextResponse.json({ success: result.success })
    }

    return NextResponse.json({ error: `Unknown channel: ${channel}` }, { status: 400 })
  } catch (err) {
    console.error('Notification send error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
