import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/supabase/verify-super-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await verifySuperAdmin()
  if (auth.error) return auth.error

  const body = await request.json()
  const { name, email, legal_name, cnpj, oab_number, phone, plan_type } = body

  if (!name || !email) {
    return NextResponse.json({ error: 'Nome e email sao obrigatorios' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('law_firms')
    .insert({
      name,
      email,
      legal_name: legal_name || null,
      cnpj: cnpj || null,
      oab_number: oab_number || null,
      phone: phone || null,
      plan_type: plan_type || 'trial',
      subscription_active: true,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
