import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_ROLES = ['super_admin', 'admin', 'lawyer', 'staff']

export async function verifyAIUser() {
  const supabase = createClient()

  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, user_type, law_firm_id, first_name, last_name, full_name, email')
    .eq('auth_user_id', session.user.id)
    .single()

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Perfil não encontrado' }, { status: 403 }) }
  }

  if (!ALLOWED_ROLES.includes(profile.user_type)) {
    return { error: NextResponse.json({ error: 'Acesso restrito. Clientes não podem usar a assistente de IA.' }, { status: 403 }) }
  }

  return { profile, session }
}
