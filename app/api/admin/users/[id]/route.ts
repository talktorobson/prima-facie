import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { updateUser, deactivateUser, verifyFirmOwnership } from '@/lib/services/user-management'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  if (body.user_type === 'super_admin') {
    return NextResponse.json(
      { error: 'Nao e permitido definir tipo Super Admin' },
      { status: 403 }
    )
  }

  // Verify firm scoping (admin only)
  if (profile.user_type === 'admin') {
    const check = await verifyFirmOwnership(params.id, profile.law_firm_id!)
    if ('error' in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }
  }

  const result = await updateUser(params.id, body)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ data: result.data })
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

  if (params.id === profile.id) {
    return NextResponse.json(
      { error: 'Nao e possivel desativar o proprio usuario' },
      { status: 400 }
    )
  }

  // Verify firm scoping + last-admin guard (admin only)
  if (profile.user_type === 'admin') {
    const check = await verifyFirmOwnership(params.id, profile.law_firm_id!, 'law_firm_id, user_type')
    if ('error' in check) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    if (check.data.user_type === 'admin') {
      const supabase = createAdminClient()
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

  const result = await deactivateUser(params.id)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ data: result.data })
}
