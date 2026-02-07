import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/supabase/verify-super-admin'
import { resetUserPassword } from '@/lib/services/user-management'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin()
  if (auth.error) return auth.error

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
  }

  const result = await resetUserPassword(params.id)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ message: result.message })
}
