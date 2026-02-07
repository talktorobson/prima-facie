import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { contactFormSchema } from '@/lib/schemas/contact-form-schema'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate with Zod schema
    const parsed = contactFormSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return NextResponse.json(
        { error: firstError?.message || 'Dados invalidos' },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Use service role key for server-side insert (bypasses RLS)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Erro de configuracao do servidor' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase.from('contact_submissions').insert({
      subject: data.subject,
      urgency: data.urgency,
      city: data.city || null,
      role: data.role || null,
      company_name: data.company_name || null,
      cnpj: data.cnpj || null,
      employee_count: data.employee_count || null,
      segment: data.segment || null,
      details: data.details || null,
      name: data.name,
      email: data.email,
      phone: data.phone,
      preferred_channel: data.preferred_channel || null,
      preferred_time: data.preferred_time || null,
      marketing_consent: data.marketing_consent || false,
      status: 'pending',
    })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar formulario. Tente novamente.' },
        { status: 500 }
      )
    }

    // Create prospect in pipeline (requires DEFAULT_LAW_FIRM_ID)
    const lawFirmId = process.env.DEFAULT_LAW_FIRM_ID
    if (lawFirmId) {
      try {
        await createProspect(supabase, data, lawFirmId)
      } catch (prospectError) {
        console.error('Error creating prospect (submission saved):', prospectError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function createProspect(
  supabase: ReturnType<typeof createClient>,
  data: {
    name: string
    email: string
    phone: string
    subject: string
    urgency: string
    city?: string
    company_name?: string
    cnpj?: string
    details?: { description?: string }
    preferred_channel?: string
    preferred_time?: string
    marketing_consent?: boolean
  },
  lawFirmId: string
) {
  // Split name into first/last
  const nameParts = data.name.trim().split(/\s+/)
  const firstName = nameParts[0]
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

  // Determine contact type
  const contactType = data.company_name || data.cnpj ? 'company' : 'individual'

  // Map preferred channel
  const channelMap: Record<string, string> = {
    whatsapp: 'whatsapp',
    email: 'email',
    telefone: 'phone',
  }
  const preferredComm = data.preferred_channel
    ? channelMap[data.preferred_channel] || 'email'
    : undefined

  // 1. Create contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      law_firm_id: lawFirmId,
      contact_type: contactType,
      client_status: 'prospect',
      source: 'website',
      first_name: firstName,
      last_name: lastName || null,
      full_name: data.name,
      company_name: data.company_name || null,
      cnpj: data.cnpj || null,
      email: data.email,
      phone: data.phone,
      address_city: data.city || null,
      notes: data.details?.description || null,
      preferred_communication: preferredComm || null,
    })
    .select('id')
    .single()

  if (contactError) {
    console.error('Error creating contact:', contactError)
    return
  }

  // 2. Find first intake stage
  const { data: stage } = await supabase
    .from('pipeline_stages')
    .select('id')
    .eq('law_firm_id', lawFirmId)
    .eq('stage_type', 'intake')
    .order('sort_order', { ascending: true })
    .limit(1)
    .single()

  if (!stage) {
    console.error('No intake pipeline stage found for law firm:', lawFirmId)
    return
  }

  // 3. Build notes summary
  const noteLines = [
    `Assunto: ${data.subject}`,
    `Urgência: ${data.urgency}`,
    data.preferred_channel ? `Canal preferido: ${data.preferred_channel}` : null,
    data.preferred_time ? `Horário preferido: ${data.preferred_time}` : null,
    data.marketing_consent ? 'Consentimento marketing: sim' : null,
  ].filter(Boolean).join('\n')

  // 4. Create pipeline card
  const { data: card, error: cardError } = await supabase
    .from('pipeline_cards')
    .insert({
      law_firm_id: lawFirmId,
      pipeline_stage_id: stage.id,
      contact_id: contact.id,
      title: data.name,
      description: data.details?.description
        ? `${data.subject} — ${data.details.description}`
        : data.subject,
      source: 'website',
      notes: noteLines,
    })
    .select('id')
    .single()

  if (cardError) {
    console.error('Error creating pipeline card:', cardError)
    return
  }

  // 5. Create activity log
  const { error: logError } = await supabase.from('activity_logs').insert({
    law_firm_id: lawFirmId,
    action: 'created',
    entity_type: 'prospect',
    entity_id: card.id,
    description: `Novo prospect via site: ${data.name}`,
  })

  if (logError) {
    console.error('Error creating activity log:', logError)
  }
}
