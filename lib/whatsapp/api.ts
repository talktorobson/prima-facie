// WhatsApp Business API Integration
// Meta Business Platform integration for Prima Facie

interface WhatsAppConfig {
  businessAccountId: string
  phoneNumberId: string
  accessToken: string
  webhookVerifyToken: string
  apiVersion: string
}

interface WhatsAppMessage {
  to: string
  type: 'text' | 'template' | 'document' | 'image'
  text?: {
    body: string
  }
  template?: {
    name: string
    language: {
      code: string
    }
    components?: any[]
  }
  document?: {
    link: string
    filename: string
    caption?: string
  }
  image?: {
    link: string
    caption?: string
  }
}

interface WhatsAppWebhookPayload {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        contacts?: Array<{
          profile: {
            name: string
          }
          wa_id: string
        }>
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: string
          text?: {
            body: string
          }
          document?: {
            filename: string
            mime_type: string
            sha256: string
            id: string
          }
          image?: {
            mime_type: string
            sha256: string
            id: string
          }
        }>
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed'
          timestamp: string
          recipient_id: string
        }>
      }
      field: string
    }>
  }>
}

export class WhatsAppService {
  private config: WhatsAppConfig
  private baseUrl: string

  constructor(config: WhatsAppConfig) {
    this.config = config
    this.baseUrl = `https://graph.facebook.com/v${config.apiVersion}`
  }

  // Send a text message
  async sendTextMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const whatsappMessage: WhatsAppMessage = {
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          body: message
        }
      }

      const response = await this.sendMessage(whatsappMessage)
      return response
    } catch (error) {
      console.error('Error sending WhatsApp text message:', error)
      return { success: false, error: 'Failed to send message' }
    }
  }

  // Send a template message
  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    languageCode: string = 'pt_BR',
    components?: any[]
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const whatsappMessage: WhatsAppMessage = {
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components || []
        }
      }

      const response = await this.sendMessage(whatsappMessage)
      return response
    } catch (error) {
      console.error('Error sending WhatsApp template message:', error)
      return { success: false, error: 'Failed to send template message' }
    }
  }

  // Send a document
  async sendDocument(
    to: string, 
    documentUrl: string, 
    filename: string, 
    caption?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const whatsappMessage: WhatsAppMessage = {
        to: this.formatPhoneNumber(to),
        type: 'document',
        document: {
          link: documentUrl,
          filename: filename,
          caption: caption
        }
      }

      const response = await this.sendMessage(whatsappMessage)
      return response
    } catch (error) {
      console.error('Error sending WhatsApp document:', error)
      return { success: false, error: 'Failed to send document' }
    }
  }

  // Send an image
  async sendImage(
    to: string, 
    imageUrl: string, 
    caption?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const whatsappMessage: WhatsAppMessage = {
        to: this.formatPhoneNumber(to),
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      }

      const response = await this.sendMessage(whatsappMessage)
      return response
    } catch (error) {
      console.error('Error sending WhatsApp image:', error)
      return { success: false, error: 'Failed to send image' }
    }
  }

  // Private method to send message to WhatsApp API
  private async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          ...message
        })
      })

      const data = await response.json()

      if (response.ok && data.messages) {
        return {
          success: true,
          messageId: data.messages[0].id
        }
      } else {
        console.error('WhatsApp API Error:', data)
        return {
          success: false,
          error: data.error?.message || 'Unknown error'
        }
      }
    } catch (error) {
      console.error('WhatsApp API Request Error:', error)
      return {
        success: false,
        error: 'Network error'
      }
    }
  }

  // Download media from WhatsApp
  async downloadMedia(mediaId: string): Promise<{ success: boolean; data?: ArrayBuffer; error?: string }> {
    try {
      // First, get the media URL
      const mediaUrlResponse = await fetch(`${this.baseUrl}/${mediaId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (!mediaUrlResponse.ok) {
        return { success: false, error: 'Failed to get media URL' }
      }

      const mediaData = await mediaUrlResponse.json()
      const mediaUrl = mediaData.url

      // Download the actual media
      const mediaResponse = await fetch(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (!mediaResponse.ok) {
        return { success: false, error: 'Failed to download media' }
      }

      const buffer = await mediaResponse.arrayBuffer()
      return { success: true, data: buffer }
    } catch (error) {
      console.error('Error downloading WhatsApp media:', error)
      return { success: false, error: 'Download failed' }
    }
  }

  // Verify webhook signature
  verifyWebhook(body: string, signature: string): boolean {
    try {
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', this.config.accessToken)
        .update(body, 'utf8')
        .digest('hex')
      
      return signature === `sha256=${expectedSignature}`
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }

  // Process incoming webhook
  async processWebhook(payload: WhatsAppWebhookPayload): Promise<{
    messages: Array<{
      from: string
      messageId: string
      timestamp: string
      type: string
      content: string
      mediaId?: string
      filename?: string
    }>
    statuses: Array<{
      messageId: string
      status: string
      timestamp: string
      recipientId: string
    }>
  }> {
    const messages: any[] = []
    const statuses: any[] = []

    try {
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            // Process incoming messages
            if (change.value.messages) {
              for (const message of change.value.messages) {
                let content = ''
                let mediaId = undefined
                let filename = undefined

                switch (message.type) {
                  case 'text':
                    content = message.text?.body || ''
                    break
                  case 'document':
                    content = message.document?.filename || 'Documento'
                    mediaId = message.document?.id
                    filename = message.document?.filename
                    break
                  case 'image':
                    content = 'Imagem'
                    mediaId = message.image?.id
                    break
                  default:
                    content = `Mensagem do tipo: ${message.type}`
                }

                messages.push({
                  from: message.from,
                  messageId: message.id,
                  timestamp: message.timestamp,
                  type: message.type,
                  content,
                  mediaId,
                  filename
                })
              }
            }

            // Process message statuses
            if (change.value.statuses) {
              for (const status of change.value.statuses) {
                statuses.push({
                  messageId: status.id,
                  status: status.status,
                  timestamp: status.timestamp,
                  recipientId: status.recipient_id
                })
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing WhatsApp webhook:', error)
    }

    return { messages, statuses }
  }

  // Format phone number for WhatsApp API
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '')
    
    // If it starts with 55 (Brazil country code), use as is
    if (cleaned.startsWith('55')) {
      return cleaned
    }
    
    // If it's a Brazilian number without country code, add 55
    if (cleaned.length === 11 || cleaned.length === 10) {
      return `55${cleaned}`
    }
    
    // Return as is for other cases
    return cleaned
  }

  // Validate phone number format
  isValidPhoneNumber(phone: string): boolean {
    const cleaned = this.formatPhoneNumber(phone)
    
    // Brazilian numbers: 55 + 2 digits (area code) + 8-9 digits (number)
    return /^55\d{10,11}$/.test(cleaned)
  }

  // Pre-defined templates for Brazilian law firms
  static getDefaultTemplates() {
    return {
      welcome: {
        name: 'welcome_client',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: '{{client_name}}' },
              { type: 'text', text: '{{law_firm_name}}' }
            ]
          }
        ]
      },
      appointment_reminder: {
        name: 'appointment_reminder',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: '{{client_name}}' },
              { type: 'text', text: '{{appointment_date}}' },
              { type: 'text', text: '{{appointment_time}}' }
            ]
          }
        ]
      },
      document_received: {
        name: 'document_received',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: '{{client_name}}' },
              { type: 'text', text: '{{document_name}}' }
            ]
          }
        ]
      },
      case_update: {
        name: 'case_update',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: '{{client_name}}' },
              { type: 'text', text: '{{case_number}}' },
              { type: 'text', text: '{{update_description}}' }
            ]
          }
        ]
      }
    }
  }
}

// Utility functions for WhatsApp integration
export const whatsappUtils = {
  // Format phone number for display
  formatPhoneForDisplay: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      const number = cleaned.substring(2)
      if (number.length === 11) {
        return `+55 (${number.substring(0, 2)}) ${number.substring(2, 3)} ${number.substring(3, 7)}-${number.substring(7)}`
      } else if (number.length === 10) {
        return `+55 (${number.substring(0, 2)}) ${number.substring(2, 6)}-${number.substring(6)}`
      }
    }
    
    return phone
  },

  // Generate WhatsApp chat URL
  generateChatUrl: (phone: string, message?: string): string => {
    const formatted = phone.replace(/\D/g, '')
    const baseUrl = 'https://wa.me/'
    const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : ''
    
    return `${baseUrl}${formatted}${encodedMessage}`
  },

  // Check if message is from business hours
  isBusinessHours: (timestamp: string, timezone: string = 'America/Sao_Paulo'): boolean => {
    const date = new Date(parseInt(timestamp) * 1000)
    const hour = date.toLocaleString('en-US', { 
      hour: 'numeric', 
      hour12: false, 
      timeZone: timezone 
    })
    
    const hourNum = parseInt(hour)
    const dayOfWeek = date.getDay()
    
    // Monday to Friday: 9 AM to 6 PM
    // Saturday: 9 AM to 12 PM
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return hourNum >= 9 && hourNum < 18
    } else if (dayOfWeek === 6) {
      return hourNum >= 9 && hourNum < 12
    }
    
    return false
  }
}

// Export WhatsApp service factory
export const createWhatsAppService = (config: WhatsAppConfig): WhatsAppService => {
  return new WhatsAppService(config)
}