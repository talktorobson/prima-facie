import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email('E-mail invalido'),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Validate email
    const parsed = emailSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'E-mail invalido' },
        { status: 400 }
      )
    }

    const { email } = parsed.data

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

    // Upsert to handle duplicate emails gracefully
    // If email already exists, update created_at and clear unsubscribed_at (re-subscribe)
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email,
          created_at: new Date().toISOString(),
          unsubscribed_at: null,
        },
        { onConflict: 'email' }
      )

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json(
        { error: 'Erro ao processar inscricao. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Newsletter API error:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
