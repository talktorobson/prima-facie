import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { createAdminClient } from '@/lib/supabase/admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ALLOWED_FIELDS = [
  'first_name', 'last_name', 'user_type', 'status',
  'oab_number', 'position', 'phone', 'mobile', 'department',
]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const { profile } = auth

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

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
  if (auth.error) return auth.error

  const { profile } = auth

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
  }

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
      .select('law_firm_id, user_type')
      .eq('id', params.id)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }

    if (targetUser.law_firm_id !== profile.law_firm_id) {
      return NextResponse.json({ error: 'Acesso negado: usuario de outro escritorio' }, { status: 403 })
    }

    // Prevent deactivating the last admin of a firm
    if (targetUser.user_type === 'admin') {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('law_firm_id', profile.law_firm_id!)
        .eq('user_type', 'admin')
        .eq('status', 'active')

      if (count !== null && count <= 1) {
        return NextResponse.json(
          { error: 'Nao e possivel desativar o ultimo administrador do escritorio' },
          { status: 400 }
        )
      }
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
