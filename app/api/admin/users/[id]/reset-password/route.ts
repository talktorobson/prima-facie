import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { resetUserPassword } from '@/lib/services/user-management'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const { profile } = auth

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 })
  }

  // For admin callers, verify firm scoping before reset
  if (profile.user_type === 'admin') {
    const supabase = createAdminClient()
    const { data: user, error } = await supabase
      .from('users')
      .select('law_firm_id')
      .eq('id', params.id)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
    }
    if (user.law_firm_id !== profile.law_firm_id) {
      return NextResponse.json({ error: 'Acesso negado: usuario de outro escritorio' }, { status: 403 })
    }
  }

  const result = await resetUserPassword(params.id)

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ message: result.message })
}
