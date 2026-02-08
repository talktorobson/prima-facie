import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService, whatsappUtils } from '@/lib/whatsapp/api'
import { createAdminClient } from '@/lib/supabase/admin'

// Mock WhatsApp configuration - in production, this would come from environment variables
const whatsappConfig = {
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'prima_facie_webhook_token',
  apiVersion: 'v17.0'
}

const whatsappService = new WhatsAppService(whatsappConfig)

// Handle WhatsApp webhook verification (GET request)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Verify the webhook
  if (mode === 'subscribe' && token === whatsappConfig.webhookVerifyToken) {
    console.log('WhatsApp webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  } else {
    console.error('WhatsApp webhook verification failed')
    return new NextResponse('Verification failed', { status: 403 })
  }
}

// Handle incoming WhatsApp messages (POST request)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256') || ''
    
    // Verify webhook signature
    if (!whatsappService.verifyWebhook(body, signature)) {
      console.error('Invalid WhatsApp webhook signature')
      return new NextResponse('Invalid signature', { status: 401 })
    }

    const payload = JSON.parse(body)
    console.log('WhatsApp webhook received:', JSON.stringify(payload, null, 2))

    // Process the webhook payload
    const { messages, statuses } = await whatsappService.processWebhook(payload)

    // Handle incoming messages
    for (const message of messages) {
      await handleIncomingMessage(message)
    }

    // Handle message status updates
    for (const status of statuses) {
      await handleMessageStatus(status)
    }

    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing WhatsApp webhook:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

// Handle incoming WhatsApp message
async function handleIncomingMessage(message: {
  from: string
  messageId: string
  timestamp: string
  type: string
  content: string
  mediaId?: string
  filename?: string
}) {
  try {
    const supabase = createAdminClient()
    console.log('Processing incoming WhatsApp message:', message)

    // Find or create conversation for this WhatsApp number
    const conversation = await findOrCreateWhatsAppConversation(message.from)
    
    if (!conversation) {
      console.error('Could not find or create conversation for WhatsApp number:', message.from)
      return
    }

    // Handle media download if needed
    const attachments: { name?: string; size?: number; type?: string; url: string }[] = []

    if (message.mediaId && (message.type === 'document' || message.type === 'image')) {
      const mediaResult = await whatsappService.downloadMedia(message.mediaId)
      if (mediaResult.success && mediaResult.data) {
        attachments.push({
          name: message.filename,
          size: mediaResult.data.byteLength,
          type: message.type === 'image' ? 'image/jpeg' : 'application/octet-stream',
          url: `whatsapp://media/${message.mediaId}`,
        })
      }
    }

    // Save message to database
    const messageData = {
      law_firm_id: conversation.law_firm_id,
      conversation_id: conversation.id,
      contact_id: conversation.contact_id,
      sender_id: conversation.contact_id,
      sender_type: 'contact' as const,
      message_type: message.type === 'text' ? 'text' as const : 'file' as const,
      content: message.content,
      external_message_id: message.messageId,
      external_platform: 'whatsapp',
      status: 'delivered' as const,
      attachments: attachments.length > 0 ? attachments : [],
    }

    const { data: savedMessage, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('Error saving WhatsApp message to database:', error)
      return
    }

    console.log('WhatsApp message saved to database:', savedMessage)

    // Send auto-reply if outside business hours
    if (!whatsappUtils.isBusinessHours(message.timestamp)) {
      await sendAutoReply(message.from, conversation)
    }

  } catch (error) {
    console.error('Error handling incoming WhatsApp message:', error)
  }
}

// Handle WhatsApp message status updates
async function handleMessageStatus(status: {
  messageId: string
  status: string
  timestamp: string
  recipientId: string
}) {
  try {
    const supabase = createAdminClient()
    console.log('Processing WhatsApp message status:', status)

    // Update message status in database
    const updateData: Record<string, string> = {
      status: status.status,
      updated_at: new Date().toISOString(),
    }

    if (status.status === 'read') {
      updateData.read_at = new Date(parseInt(status.timestamp) * 1000).toISOString()
    }

    const { error } = await supabase
      .from('messages')
      .update(updateData)
      .eq('external_message_id', status.messageId)

    if (error) {
      console.error('Error updating message status:', error)
      return
    }

    console.log('WhatsApp message status updated')
  } catch (error) {
    console.error('Error handling WhatsApp message status:', error)
  }
}

// Find or create conversation for WhatsApp number
async function findOrCreateWhatsAppConversation(whatsappPhone: string): Promise<{ id: string; law_firm_id: string; contact_id?: string } | null> {
  try {
    const supabase = createAdminClient()

    // Find contact by phone number (contacts table has phone + mobile columns)
    const cleanPhone = whatsappPhone.replace(/\D/g, '')
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .or(`phone.ilike.%${cleanPhone}%,mobile.ilike.%${cleanPhone}%`)
      .single()

    if (!contact) {
      console.error('No contact found for WhatsApp number:', whatsappPhone)
      return null
    }

    // Check for existing active whatsapp conversation with this contact
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('contact_id', contact.id)
      .eq('conversation_type', 'whatsapp')
      .eq('status', 'active')
      .single()

    if (existingConversation) {
      return { ...existingConversation, contact_id: contact.id }
    }

    // Create new WhatsApp conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        law_firm_id: contact.law_firm_id,
        contact_id: contact.id,
        title: `WhatsApp - ${contact.full_name || contact.first_name || whatsappPhone}`,
        description: `Conversa WhatsApp iniciada pelo contato ${whatsappPhone}`,
        conversation_type: 'whatsapp',
        status: 'active',
        priority: 'normal',
        topic: 'Geral',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating WhatsApp conversation:', error)
      return null
    }

    // Add contact as participant
    await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: newConversation.id,
        contact_id: contact.id,
        role: 'participant',
      })

    // Add default lawyer as participant (first lawyer from the firm)
    const { data: lawyer } = await supabase
      .from('users')
      .select('id')
      .eq('law_firm_id', contact.law_firm_id)
      .eq('user_type', 'lawyer')
      .limit(1)
      .single()

    if (lawyer) {
      await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: newConversation.id,
          user_id: lawyer.id,
          role: 'moderator',
        })
    }

    console.log('Created new WhatsApp conversation:', newConversation)
    return { ...newConversation, contact_id: contact.id }

  } catch (error) {
    console.error('Error finding/creating WhatsApp conversation:', error)
    return null
  }
}

// Send auto-reply for messages outside business hours
async function sendAutoReply(to: string, conversation: { id: string; law_firm_id: string; contact_id?: string }) {
  try {
    const supabase = createAdminClient()
    const autoReplyMessage = `Olá! Recebemos sua mensagem fora do horário de atendimento.

📞 Horário de Atendimento:
• Segunda a Sexta: 8h30 às 17h30

⚡ Para urgências, use a palavra "URGENTE" que responderemos em até 1 hora.

Responderemos sua mensagem no próximo horário comercial.

Obrigado!
Dávila Reis Advocacia`

    const result = await whatsappService.sendTextMessage(to, autoReplyMessage)

    if (result.success) {
      // Save auto-reply to database
      await supabase
        .from('messages')
        .insert({
          law_firm_id: conversation.law_firm_id,
          conversation_id: conversation.id,
          sender_id: null,
          sender_type: 'system',
          message_type: 'system',
          content: 'Mensagem automática enviada (fora do horário)',
          external_message_id: result.messageId,
          external_platform: 'whatsapp',
          status: 'sent',
        })
    }
  } catch (error) {
    console.error('Error sending auto-reply:', error)
  }
}