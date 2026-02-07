import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { userCreateSchema } from '@/lib/schemas/settings-schemas'
import { createUser } from '@/lib/services/user-management'

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if (auth.error) return auth.error

  const { profile } = auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON invalido' }, { status: 400 })
  }

  const parsed = userCreateSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Dados invalidos'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  // Zod schema restricts user_type to ['admin','lawyer','staff','client'] — super_admin is rejected
  const { email, password, first_name, last_name, user_type } = parsed.data

  // Firm scoping: admin uses their own firm; super_admin requires law_firm_id in body
  let targetFirmId: string
  if (profile.user_type === 'super_admin') {
    const law_firm_id = body.law_firm_id as string | undefined
    if (!law_firm_id) {
      return NextResponse.json(
        { error: 'law_firm_id e obrigatorio para Super Admin' },
        { status: 400 }
      )
    }
    // Verify target firm exists
    const supabase = createAdminClient()
    const { data: firm, error: firmError } = await supabase
      .from('law_firms')
      .select('id')
      .eq('id', law_firm_id)
      .single()

    if (firmError || !firm) {
      return NextResponse.json({ error: 'Escritorio nao encontrado' }, { status: 404 })
    }
    targetFirmId = law_firm_id
  } else {
    targetFirmId = profile.law_firm_id!
  }

  const result = await createUser({
    email, password, first_name, last_name, user_type,
    law_firm_id: targetFirmId,
    oab_number: body.oab_number, position: body.position, phone: body.phone,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({ data: result.data }, { status: 201 })
}
