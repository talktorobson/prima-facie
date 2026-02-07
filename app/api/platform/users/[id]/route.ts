import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/supabase/verify-super-admin'
import { updateUser, deactivateUser } from '@/lib/services/user-management'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin()
  if (auth.error) return auth.error

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
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
  const auth = await verifySuperAdmin()
  if (auth.error) return auth.error

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
  }

  const result = await deactivateUser(params.id)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ data: result.data })
}
