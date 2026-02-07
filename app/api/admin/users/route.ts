import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { userCreateSchema } from '@/lib/schemas/settings-schemas'

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

  // Validate with Zod schema
  const parsed = userCreateSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message || 'Dados invalidos'
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  // Zod schema restricts user_type to ['admin','lawyer','staff','client'] — super_admin is rejected
  const { email, password, first_name, last_name, user_type } = parsed.data
  const { oab_number, position, phone } = body
  const law_firm_id = body.law_firm_id as string | undefined

  // Firm scoping: admin uses their own firm; super_admin requires law_firm_id in body
  let targetFirmId: string
  if (profile.user_type === 'super_admin') {
    if (!law_firm_id) {
      return NextResponse.json(
        { error: 'law_firm_id e obrigatorio para Super Admin' },
        { status: 400 }
      )
    }
    targetFirmId = law_firm_id
  } else {
    targetFirmId = profile.law_firm_id!
  }

  const supabase = createAdminClient()

  // Verify target firm exists (super_admin only — admin's firm is guaranteed)
  if (profile.user_type === 'super_admin') {
    const { data: firm, error: firmError } = await supabase
      .from('law_firms')
      .select('id')
      .eq('id', targetFirmId)
      .single()

    if (firmError || !firm) {
      return NextResponse.json({ error: 'Escritorio nao encontrado' }, { status: 404 })
    }
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Create profile
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .insert({
      auth_user_id: authData.user.id,
      email,
      first_name,
      last_name,
      user_type,
      law_firm_id: targetFirmId,
      oab_number: oab_number || null,
      position: position || null,
      phone: phone || null,
      status: 'active',
    })
    .select()
    .single()

  if (profileError) {
    // Rollback: delete auth user if profile creation failed
    const { error: rollbackError } = await supabase.auth.admin.deleteUser(authData.user.id)
    if (rollbackError) {
      console.error('CRITICAL: rollback failed — orphaned auth user', {
        authUserId: authData.user.id,
        profileError: profileError.message,
        rollbackError: rollbackError.message,
      })
    }
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ data: userProfile }, { status: 201 })
}
