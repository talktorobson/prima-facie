import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/supabase/verify-super-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await verifySuperAdmin()
  if (auth.error) return auth.error

  const body = await request.json()
  const { email, password, first_name, last_name, user_type, law_firm_id, oab_number, position, phone } = body

  if (!email || !password || !first_name || !last_name || !user_type || !law_firm_id) {
    return NextResponse.json(
      { error: 'Email, senha, nome, sobrenome, tipo e escritorio sao obrigatorios' },
      { status: 400 }
    )
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
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .insert({
      auth_user_id: authData.user.id,
      email,
      first_name,
      last_name,
      user_type,
      law_firm_id,
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

  return NextResponse.json({ data: profile }, { status: 201 })
}
