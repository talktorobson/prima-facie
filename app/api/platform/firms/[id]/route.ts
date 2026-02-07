import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/supabase/verify-super-admin'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_FIELDS = [
  'name', 'legal_name', 'email', 'phone', 'website',
  'cnpj', 'oab_number', 'plan_type', 'subscription_active',
  'address_street', 'address_number', 'address_complement',
  'address_neighborhood', 'address_city', 'address_state', 'address_zipcode',
  'logo_url', 'primary_color', 'secondary_color',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin()
  if (auth.error) return auth.error

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo valido para atualizar' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('law_firms')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
