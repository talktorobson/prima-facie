import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/supabase/verify-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdmin()
  if ('error' in auth) return auth.error

  const { profile } = auth

  const supabase = createAdminClient()

  // Get user email from profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, auth_user_id, law_firm_id')
    .eq('id', params.id)
    .single()

  if (userError || !user?.email) {
    return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
  }

  // Verify firm scoping (admin only)
  if (profile.user_type === 'admin' && user.law_firm_id !== profile.law_firm_id) {
    return NextResponse.json({ error: 'Acesso negado: usuario de outro escritorio' }, { status: 403 })
  }

  // Generate recovery link
  const { error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
  })

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Link de recuperacao enviado para ' + user.email })
}
