import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/supabase/verify-super-admin'
import { createUser } from '@/lib/services/user-management'

export async function POST(request: NextRequest) {
  const auth = await verifySuperAdmin()
  if (auth.error) return auth.error

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

  const { email, password, first_name, last_name, user_type, law_firm_id, oab_number, position, phone } = body as Record<string, string | undefined>

  if (!email || !password || !first_name || !last_name || !user_type || !law_firm_id) {
    return NextResponse.json(
      { error: 'Email, senha, nome, sobrenome, tipo e escritorio sao obrigatorios' },
      { status: 400 }
    )
  }

  const result = await createUser({
    email, password, first_name, last_name, user_type,
    law_firm_id,
    oab_number, position, phone,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ data: result.data }, { status: 201 })
}
