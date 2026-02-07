import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function verifySuperAdmin() {
  const supabase = createClient()

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return { error: NextResponse.json({ error: 'Nao autenticado' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, user_type')
    .eq('auth_user_id', session.user.id)
    .single()

  if (profileError || !profile || profile.user_type !== 'super_admin') {
    return { error: NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 }) }
  }

  return { profile, session }
}
