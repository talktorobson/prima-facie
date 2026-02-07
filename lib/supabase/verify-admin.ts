import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function verifyAdmin() {
  const supabase = createClient()

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return { error: NextResponse.json({ error: 'Nao autenticado' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, user_type, law_firm_id')
    .eq('auth_user_id', session.user.id)
    .single()

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 403 }) }
  }

  if (profile.user_type !== 'admin' && profile.user_type !== 'super_admin') {
    return { error: NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 }) }
  }

  if (profile.user_type === 'admin' && !profile.law_firm_id) {
    return { error: NextResponse.json({ error: 'Administrador sem escritorio associado' }, { status: 403 }) }
  }

  return { profile, session }
}
