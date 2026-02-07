import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_FIELDS = [
  'first_name', 'last_name', 'user_type', 'status',
  'oab_number', 'position', 'phone', 'mobile', 'department',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin()
  if ('error' in auth) return auth.error

  const { profile } = auth

  const body = await request.json()

  // Reject escalation to super_admin
  if (body.user_type === 'super_admin') {
    return NextResponse.json(
      { error: 'Nao e permitido definir tipo Super Admin' },
      { status: 403 }
    )
  }

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

  // Verify target user belongs to caller's firm (admin only)
  if (profile.user_type === 'admin') {
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('law_firm_id')
      .eq('id', params.id)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }

    if (targetUser.law_firm_id !== profile.law_firm_id) {
      return NextResponse.json({ error: 'Acesso negado: usuario de outro escritorio' }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin()
  if ('error' in auth) return auth.error

  const { profile } = auth

  // Prevent self-deactivation
  if (params.id === profile.id) {
    return NextResponse.json(
      { error: 'Nao e possivel desativar o proprio usuario' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Verify target user belongs to caller's firm (admin only)
  if (profile.user_type === 'admin') {
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('law_firm_id')
      .eq('id', params.id)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }

    if (targetUser.law_firm_id !== profile.law_firm_id) {
      return NextResponse.json({ error: 'Acesso negado: usuario de outro escritorio' }, { status: 403 })
    }
  }

  const { data, error } = await supabase
    .from('users')
    .update({ status: 'inactive' })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
