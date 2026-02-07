import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const websiteContactSchema = z.object({
  law_firm_id: z.string().uuid('ID do escritorio invalido'),
  name: z.string().min(1, 'Nome e obrigatorio'),
  email: z.string().email('E-mail invalido'),
  phone: z.string().min(1, 'Telefone e obrigatorio'),
  company_name: z.string().optional(),
  cnpj: z.string().optional(),
  custom_fields: z.record(z.string(), z.string()).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const parsed = websiteContactSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]
      return NextResponse.json(
        { error: firstError?.message || 'Dados invalidos' },
        { status: 400 }
      )
    }

    const data = parsed.data

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

    // Verify law firm exists
    const { data: firm } = await supabase
      .from('law_firms')
      .select('id')
      .eq('id', data.law_firm_id)
      .single()

    if (!firm) {
      return NextResponse.json(
        { error: 'Escritorio nao encontrado' },
        { status: 404 }
      )
    }

    // Insert contact submission
    const { error: submitError } = await supabase.from('contact_submissions').insert({
      law_firm_id: data.law_firm_id,
      subject: 'website',
      name: data.name,
      email: data.email,
      phone: data.phone,
      company_name: data.company_name || null,
      cnpj: data.cnpj || null,
      custom_fields: data.custom_fields || null,
      status: 'pending',
    })

    if (submitError) {
      console.error('Supabase insert error:', submitError)
      return NextResponse.json(
        { error: 'Erro ao salvar formulario. Tente novamente.' },
        { status: 500 }
      )
    }

    // Create prospect in pipeline
    try {
      await createProspect(supabase, data)
    } catch (prospectError) {
      console.error('Error creating prospect (submission saved):', prospectError)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Website contact API error:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function createProspect(
  supabase: ReturnType<typeof createClient>,
  data: {
    law_firm_id: string
    name: string
    email: string
    phone: string
    company_name?: string
    cnpj?: string
    custom_fields?: Record<string, string>
  }
) {
  const nameParts = data.name.trim().split(/\s+/)
  const firstName = nameParts[0]
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''
  const contactType = data.company_name || data.cnpj ? 'company' : 'individual'

  // 1. Create contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      law_firm_id: data.law_firm_id,
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
    .eq('law_firm_id', data.law_firm_id)
    .eq('stage_type', 'intake')
    .order('sort_order', { ascending: true })
    .limit(1)
    .single()

  if (!stage) {
    console.error('No intake pipeline stage found for law firm:', data.law_firm_id)
    return
  }

  // 3. Build notes from custom fields
  const noteLines = Object.entries(data.custom_fields || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  // 4. Create pipeline card
  const { data: card, error: cardError } = await supabase
    .from('pipeline_cards')
    .insert({
      law_firm_id: data.law_firm_id,
      pipeline_stage_id: stage.id,
      contact_id: contact.id,
      title: data.name,
      description: data.company_name
        ? `Contato via site — ${data.company_name}`
        : 'Contato via site',
      source: 'website',
      notes: noteLines || null,
    })
    .select('id')
    .single()

  if (cardError) {
    console.error('Error creating pipeline card:', cardError)
    return
  }

  // 5. Create activity log
  const { error: logError } = await supabase.from('activity_logs').insert({
    law_firm_id: data.law_firm_id,
    action: 'created',
    entity_type: 'prospect',
    entity_id: card.id,
    description: `Novo prospect via site: ${data.name}`,
  })

  if (logError) {
    console.error('Error creating activity log:', logError)
  }
}
