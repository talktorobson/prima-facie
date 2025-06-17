import { NextRequest, NextResponse } from 'next/server'
import { WhatsAppService, whatsappUtils } from '@/lib/whatsapp/api'
import { createClient } from '@/lib/supabase/client'
import { chatService } from '@/lib/supabase/realtime'

const supabase = createClient()

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
    console.log('Processing incoming WhatsApp message:', message)

    // Find or create conversation for this WhatsApp number
    const conversation = await findOrCreateWhatsAppConversation(message.from)
    
    if (!conversation) {
      console.error('Could not find or create conversation for WhatsApp number:', message.from)
      return
    }

    // Handle media download if needed
    let fileUrl = undefined
    let fileName = message.filename
    let fileSize = undefined
    let fileType = undefined

    if (message.mediaId && (message.type === 'document' || message.type === 'image')) {
      const mediaResult = await whatsappService.downloadMedia(message.mediaId)
      if (mediaResult.success && mediaResult.data) {
        // In production, upload to Supabase Storage or another service
        // For now, we'll store the media ID as a reference
        fileUrl = `whatsapp://media/${message.mediaId}`
        fileSize = mediaResult.data.byteLength
        fileType = message.type === 'image' ? 'image/jpeg' : 'application/octet-stream'
      }
    }

    // Save message to database
    const messageData = {
      conversation_id: conversation.id,
      sender_client_id: conversation.client_id, // WhatsApp messages come from clients
      message_type: message.type === 'text' ? 'text' as const : 
                   message.type === 'document' ? 'document' as const :
                   message.type === 'image' ? 'image' as const : 'whatsapp' as const,
      content: message.content,
      file_url: fileUrl,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      whatsapp_message_id: message.messageId,
      whatsapp_status: 'delivered',
      whatsapp_timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      is_edited: false,
      is_deleted: false
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
    console.log('Processing WhatsApp message status:', status)

    // Update message status in database
    const { error } = await supabase
      .from('messages')
      .update({
        whatsapp_status: status.status,
        updated_at: new Date().toISOString()
      })
      .eq('whatsapp_message_id', status.messageId)

    if (error) {
      console.error('Error updating message status:', error)
      return
    }

    // Also update message_status table for read receipts
    if (status.status === 'read') {
      const { data: message } = await supabase
        .from('messages')
        .select('conversation_id, sender_user_id')
        .eq('whatsapp_message_id', status.messageId)
        .single()

      if (message && message.sender_user_id) {
        await supabase
          .from('message_status')
          .upsert({
            message_id: status.messageId,
            user_id: message.sender_user_id,
            status: 'read',
            timestamp: new Date(parseInt(status.timestamp) * 1000).toISOString()
          })
      }
    }

    console.log('WhatsApp message status updated')
  } catch (error) {
    console.error('Error handling WhatsApp message status:', error)
  }
}

// Find or create conversation for WhatsApp number
async function findOrCreateWhatsAppConversation(whatsappPhone: string) {
  try {
    // First, try to find existing conversation by WhatsApp phone
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('whatsapp_phone', whatsappPhone)
      .eq('status', 'active')
      .single()

    if (existingConversation) {
      return existingConversation
    }

    // Try to find client by phone number
    const cleanPhone = whatsappPhone.replace(/\D/g, '')
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .or(`phone.ilike.%${cleanPhone}%,mobile.ilike.%${cleanPhone}%,whatsapp.ilike.%${cleanPhone}%`)
      .single()

    if (!client) {
      console.error('No client found for WhatsApp number:', whatsappPhone)
      return null
    }

    // Get default law firm and topic
    const { data: lawFirm } = await supabase
      .from('law_firms')
      .select('id')
      .limit(1)
      .single()

    // Determine topic based on message content
    let topicName = 'Geral' // Default topic
    
    const messageContent = message.content.toLowerCase()
    if (messageContent.includes('urgente') || messageContent.includes('emergency')) {
      topicName = 'Urgente'
    } else if (messageContent.includes('documento') || messageContent.includes('arquivo')) {
      topicName = 'Documentos'
    } else if (messageContent.includes('audiencia') || messageContent.includes('prazo')) {
      topicName = 'Audiências'
    } else if (messageContent.includes('consulta') || messageContent.includes('duvida')) {
      topicName = 'Consulta Jurídica'
    }

    const { data: defaultTopic } = await supabase
      .from('conversation_topics')
      .select('id')
      .eq('name', topicName)
      .limit(1)
      .single()

    // Create new WhatsApp conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        law_firm_id: lawFirm?.id,
        topic_id: defaultTopic?.id,
        client_id: client.id,
        title: `WhatsApp - ${client.name}`,
        conversation_type: 'whatsapp',
        status: 'active',
        priority: 'normal',
        is_whatsapp_enabled: true,
        whatsapp_phone: whatsappPhone
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating WhatsApp conversation:', error)
      return null
    }

    // Add client as participant
    await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: newConversation.id,
        client_id: client.id,
        participant_type: 'client',
        role: 'participant'
      })

    // Add default lawyer as participant (get first lawyer from the firm)
    const { data: lawyer } = await supabase
      .from('users')
      .select('id')
      .eq('law_firm_id', lawFirm?.id)
      .eq('role', 'lawyer')
      .limit(1)
      .single()

    if (lawyer) {
      await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: newConversation.id,
          user_id: lawyer.id,
          participant_type: 'lawyer',
          role: 'moderator'
        })
    }

    console.log('Created new WhatsApp conversation:', newConversation)
    return newConversation

  } catch (error) {
    console.error('Error finding/creating WhatsApp conversation:', error)
    return null
  }
}

// Send auto-reply for messages outside business hours
async function sendAutoReply(to: string, conversation: any) {
  try {
    const autoReplyMessage = `Olá! Recebemos sua mensagem fora do horário de atendimento.

📞 Horário de Atendimento:
• Segunda a Sexta: 9h às 18h
• Sábado: 9h às 12h

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
          conversation_id: conversation.id,
          sender_user_id: null, // System message
          message_type: 'system',
          content: 'Mensagem automática enviada (fora do horário)',
          whatsapp_message_id: result.messageId,
          whatsapp_status: 'sent'
        })
    }
  } catch (error) {
    console.error('Error sending auto-reply:', error)
  }
}