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

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
