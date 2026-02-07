import { NextRequest, NextResponse } from 'next/server'
import { verifySuperAdmin } from '@/lib/supabase/verify-super-admin'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifySuperAdmin()
  if (auth.error) return auth.error

  const supabase = createAdminClient()

  // Get user email from profile
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, auth_user_id')
    .eq('id', params.id)
    .single()

  if (userError || !user?.email) {
    return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 })
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
