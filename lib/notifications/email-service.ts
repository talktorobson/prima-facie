// =====================================================
// EMAIL NOTIFICATION SERVICE
// Billing event notifications for Prima Facie
// =====================================================

import nodemailer from 'nodemailer'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface InvoiceEmailData {
  client_name: string
  client_email: string
  invoice_number: string
  amount: number
  due_date: string
  law_firm_name: string
  law_firm_logo?: string
  payment_link?: string
  invoice_type: 'subscription' | 'case' | 'payment_plan'
}

interface PaymentEmailData {
  client_name: string
  client_email: string
  amount: number
  payment_date: string
  law_firm_name: string
  invoice_number: string
  payment_method: string
}

export class EmailNotificationService {
  private transporter: nodemailer.Transporter | null = null
  
  constructor() {
    this.initializeTransporter()
  }
  
  private initializeTransporter() {
    try {
      const config: EmailConfig = {
        host: process.env.EMAIL_SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_SMTP_USER || '',
          pass: process.env.EMAIL_SMTP_PASS || ''
        }
      }
      
      if (config.auth.user && config.auth.pass) {
        this.transporter = nodemailer.createTransport(config)
      } else {
        console.warn('Email configuration not complete - notifications will be logged only')
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error)
    }
  }
  
  // =====================================================
  // INVOICE NOTIFICATIONS
  // =====================================================
  
  /**
   * Send new invoice notification
   */
  async sendInvoiceCreated(data: InvoiceEmailData): Promise<boolean> {
    try {
      const template = this.getInvoiceCreatedTemplate(data)
      
      await this.sendEmail({
        to: data.client_email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
      
      return true
    } catch (error) {
      console.error('Error sending invoice created notification:', error)
      return false
    }
  }
  
  /**
   * Send invoice payment reminder
   */
  async sendInvoiceReminder(data: InvoiceEmailData, daysOverdue: number): Promise<boolean> {
    try {
      const template = this.getInvoiceReminderTemplate(data, daysOverdue)
      
      await this.sendEmail({
        to: data.client_email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
      
      return true
    } catch (error) {
      console.error('Error sending invoice reminder:', error)
      return false
    }
  }
  
  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(data: PaymentEmailData): Promise<boolean> {
    try {
      const template = this.getPaymentConfirmationTemplate(data)
      
      await this.sendEmail({
        to: data.client_email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
      
      return true
    } catch (error) {
      console.error('Error sending payment confirmation:', error)
      return false
    }
  }
  
  /**
   * Send subscription renewal notification
   */
  async sendSubscriptionRenewal(data: {
    client_name: string
    client_email: string
    plan_name: string
    amount: number
    next_billing_date: string
    law_firm_name: string
  }): Promise<boolean> {
    try {
      const template = this.getSubscriptionRenewalTemplate(data)
      
      await this.sendEmail({
        to: data.client_email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })
      
      return true
    } catch (error) {
      console.error('Error sending subscription renewal notification:', error)
      return false
    }
  }
  
  // =====================================================
  // EMAIL TEMPLATES
  // =====================================================
  
  private getInvoiceCreatedTemplate(data: InvoiceEmailData): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount)
    const invoiceTypeLabel = this.getInvoiceTypeLabel(data.invoice_type)
    
    return {
      subject: `Nova ${invoiceTypeLabel} - ${data.invoice_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Nova Fatura</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            ${data.law_firm_logo ? `<img src="${data.law_firm_logo}" alt="${data.law_firm_name}" style="max-width: 200px; margin-bottom: 20px;">` : ''}
            
            <h2 style="color: #2563eb;">Nova ${invoiceTypeLabel} Disponível</h2>
            
            <p>Olá, ${data.client_name}!</p>
            
            <p>Uma nova ${invoiceTypeLabel.toLowerCase()} foi gerada para você:</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td><strong>Número da Fatura:</strong></td>
                  <td>${data.invoice_number}</td>
                </tr>
                <tr>
                  <td><strong>Valor:</strong></td>
                  <td style="font-size: 18px; color: #2563eb;"><strong>${formattedAmount}</strong></td>
                </tr>
                <tr>
                  <td><strong>Vencimento:</strong></td>
                  <td>${this.formatDate(data.due_date)}</td>
                </tr>
              </table>
            </div>
            
            ${data.payment_link ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.payment_link}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Pagar Agora
                </a>
              </div>
            ` : ''}
            
            <p>Para dúvidas, entre em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            Equipe ${data.law_firm_name}</p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              Este é um e-mail automático. Por favor, não responda diretamente.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
        Nova ${invoiceTypeLabel} - ${data.invoice_number}
        
        Olá, ${data.client_name}!
        
        Uma nova ${invoiceTypeLabel.toLowerCase()} foi gerada para você:
        
        Número da Fatura: ${data.invoice_number}
        Valor: ${formattedAmount}
        Vencimento: ${this.formatDate(data.due_date)}
        
        ${data.payment_link ? `Link para pagamento: ${data.payment_link}` : ''}
        
        Para dúvidas, entre em contato conosco.
        
        Atenciosamente,
        Equipe ${data.law_firm_name}
      `
    }
  }
  
  private getInvoiceReminderTemplate(data: InvoiceEmailData, daysOverdue: number): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount)
    const invoiceTypeLabel = this.getInvoiceTypeLabel(data.invoice_type)
    const urgencyLevel = daysOverdue > 30 ? 'URGENTE' : daysOverdue > 7 ? 'Importante' : 'Lembrete'
    
    return {
      subject: `${urgencyLevel}: ${invoiceTypeLabel} em atraso - ${data.invoice_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Lembrete de Pagamento</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            ${data.law_firm_logo ? `<img src="${data.law_firm_logo}" alt="${data.law_firm_name}" style="max-width: 200px; margin-bottom: 20px;">` : ''}
            
            <h2 style="color: ${daysOverdue > 30 ? '#dc2626' : '#f59e0b'};">${urgencyLevel}: Pagamento Pendente</h2>
            
            <p>Olá, ${data.client_name}!</p>
            
            <p>Identificamos que a ${invoiceTypeLabel.toLowerCase()} abaixo está com pagamento pendente há ${daysOverdue} dias:</p>
            
            <div style="background: ${daysOverdue > 30 ? '#fef2f2' : '#fefbf2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${daysOverdue > 30 ? '#dc2626' : '#f59e0b'};">
              <table style="width: 100%;">
                <tr>
                  <td><strong>Número da Fatura:</strong></td>
                  <td>${data.invoice_number}</td>
                </tr>
                <tr>
                  <td><strong>Valor:</strong></td>
                  <td style="font-size: 18px; color: ${daysOverdue > 30 ? '#dc2626' : '#f59e0b'};"><strong>${formattedAmount}</strong></td>
                </tr>
                <tr>
                  <td><strong>Vencimento:</strong></td>
                  <td>${this.formatDate(data.due_date)}</td>
                </tr>
                <tr>
                  <td><strong>Dias em atraso:</strong></td>
                  <td><strong>${daysOverdue} dias</strong></td>
                </tr>
              </table>
            </div>
            
            ${data.payment_link ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.payment_link}" style="background: ${daysOverdue > 30 ? '#dc2626' : '#f59e0b'}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Pagar Agora
                </a>
              </div>
            ` : ''}
            
            <p>Para evitar transtornos, realize o pagamento o quanto antes. Em caso de dúvidas, entre em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            Equipe ${data.law_firm_name}</p>
          </div>
        </body>
        </html>
      `,
      text: `
        ${urgencyLevel}: ${invoiceTypeLabel} em atraso - ${data.invoice_number}
        
        Olá, ${data.client_name}!
        
        A ${invoiceTypeLabel.toLowerCase()} ${data.invoice_number} está com pagamento pendente há ${daysOverdue} dias.
        
        Valor: ${formattedAmount}
        Vencimento: ${this.formatDate(data.due_date)}
        
        ${data.payment_link ? `Link para pagamento: ${data.payment_link}` : ''}
        
        Realize o pagamento o quanto antes.
        
        Atenciosamente,
        Equipe ${data.law_firm_name}
      `
    }
  }
  
  private getPaymentConfirmationTemplate(data: PaymentEmailData): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount)
    
    return {
      subject: `Pagamento confirmado - Fatura ${data.invoice_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Pagamento Confirmado</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">✅ Pagamento Confirmado!</h2>
            
            <p>Olá, ${data.client_name}!</p>
            
            <p>Confirmamos o recebimento do seu pagamento:</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <table style="width: 100%;">
                <tr>
                  <td><strong>Fatura:</strong></td>
                  <td>${data.invoice_number}</td>
                </tr>
                <tr>
                  <td><strong>Valor Pago:</strong></td>
                  <td style="font-size: 18px; color: #10b981;"><strong>${formattedAmount}</strong></td>
                </tr>
                <tr>
                  <td><strong>Data do Pagamento:</strong></td>
                  <td>${this.formatDate(data.payment_date)}</td>
                </tr>
                <tr>
                  <td><strong>Forma de Pagamento:</strong></td>
                  <td>${data.payment_method}</td>
                </tr>
              </table>
            </div>
            
            <p>Obrigado pela sua confiança!</p>
            
            <p>Atenciosamente,<br>
            Equipe ${data.law_firm_name}</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Pagamento Confirmado - Fatura ${data.invoice_number}
        
        Olá, ${data.client_name}!
        
        Confirmamos o recebimento do seu pagamento:
        
        Fatura: ${data.invoice_number}
        Valor Pago: ${formattedAmount}
        Data: ${this.formatDate(data.payment_date)}
        Forma de Pagamento: ${data.payment_method}
        
        Obrigado pela sua confiança!
        
        Atenciosamente,
        Equipe ${data.law_firm_name}
      `
    }
  }
  
  private getSubscriptionRenewalTemplate(data: {
    client_name: string
    plan_name: string
    amount: number
    next_billing_date: string
    law_firm_name: string
  }): EmailTemplate {
    const formattedAmount = this.formatCurrency(data.amount)
    
    return {
      subject: `Renovação de assinatura - ${data.plan_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Renovação de Assinatura</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">🔄 Assinatura Renovada</h2>
            
            <p>Olá, ${data.client_name}!</p>
            
            <p>Sua assinatura foi renovada com sucesso:</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td><strong>Plano:</strong></td>
                  <td>${data.plan_name}</td>
                </tr>
                <tr>
                  <td><strong>Valor:</strong></td>
                  <td style="font-size: 18px; color: #2563eb;"><strong>${formattedAmount}</strong></td>
                </tr>
                <tr>
                  <td><strong>Próxima Cobrança:</strong></td>
                  <td>${this.formatDate(data.next_billing_date)}</td>
                </tr>
              </table>
            </div>
            
            <p>Continuamos à disposição para seus serviços jurídicos.</p>
            
            <p>Atenciosamente,<br>
            Equipe ${data.law_firm_name}</p>
          </div>
        </body>
        </html>
      `,
      text: `
        Renovação de Assinatura - ${data.plan_name}
        
        Olá, ${data.client_name}!
        
        Sua assinatura foi renovada:
        
        Plano: ${data.plan_name}
        Valor: ${formattedAmount}
        Próxima Cobrança: ${this.formatDate(data.next_billing_date)}
        
        Atenciosamente,
        Equipe ${data.law_firm_name}
      `
    }
  }
  
  // =====================================================
  // UTILITY METHODS
  // =====================================================
  
  private async sendEmail(params: {
    to: string
    subject: string
    html: string
    text: string
  }): Promise<void> {
    if (!this.transporter) {
      // Log instead of sending if no transporter
      console.log('EMAIL NOTIFICATION:', {
        to: params.to,
        subject: params.subject,
        text: params.text
      })
      return
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@primafacie.com',
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text
    }
    
    await this.transporter.sendMail(mailOptions)
  }
  
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }
  
  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  private getInvoiceTypeLabel(type: string): string {
    switch (type) {
      case 'subscription':
        return 'Fatura de Assinatura'
      case 'case':
        return 'Fatura de Caso'
      case 'payment_plan':
        return 'Parcela do Plano de Pagamento'
      default:
        return 'Fatura'
    }
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService()