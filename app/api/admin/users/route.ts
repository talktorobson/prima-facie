import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin()
  if ('error' in auth) return auth.error

  const { profile } = auth

  const body = await request.json()
  const { email, password, first_name, last_name, user_type, oab_number, position, phone, law_firm_id } = body

  if (!email || !password || !first_name || !last_name || !user_type) {
    return NextResponse.json(
      { error: 'Email, senha, nome, sobrenome e tipo sao obrigatorios' },
      { status: 400 }
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: 'A senha deve ter no minimo 8 caracteres' },
      { status: 400 }
    )
  }

  if (user_type === 'super_admin') {
    return NextResponse.json(
      { error: 'Nao e permitido criar usuarios Super Admin' },
      { status: 403 }
    )
  }

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
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ data: userProfile }, { status: 201 })
}
