import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

const ALLOWED_UPDATE_FIELDS = [
  'first_name', 'last_name', 'user_type', 'status',
  'oab_number', 'position', 'phone', 'mobile', 'department',
] as const

export type UserResult =
  | { data: Record<string, unknown>; error?: never }
  | { error: string; status: number; data?: never }

export type MessageResult =
  | { message: string; error?: never }
  | { error: string; status: number; message?: never }

interface CreateUserParams {
  email: string
  password: string
  first_name: string
  last_name: string
  user_type: string
  law_firm_id: string
  oab_number?: unknown
  position?: unknown
  phone?: unknown
}

/**
 * Create a Supabase Auth user + profile row.
 * Rolls back auth user if profile insert fails.
 */
export async function createUser(params: CreateUserParams): Promise<UserResult> {
  const { email, password, first_name, last_name, user_type, law_firm_id, oab_number, position, phone } = params
  const supabase = createAdminClient()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name, last_name },
  })

  if (authError) {
    return { error: authError.message, status: 500 }
  }

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
    const { error: rollbackError } = await supabase.auth.admin.deleteUser(authData.user.id)
    if (rollbackError) {
      console.error('CRITICAL: rollback failed — orphaned auth user', {
        authUserId: authData.user.id,
        profileError: profileError.message,
        rollbackError: rollbackError.message,
      })
    }
    return { error: profileError.message, status: 500 }
  }

  return { data: profile }
}

/**
 * Filter body to allowed fields and update user.
 */
export async function updateUser(
  userId: string,
  body: Record<string, unknown>,
  supabase?: SupabaseClient,
): Promise<UserResult> {
  const db = supabase ?? createAdminClient()

  const updates: Record<string, unknown> = {}
  for (const key of ALLOWED_UPDATE_FIELDS) {
    if (key in body) {
      updates[key] = body[key]
    }
  }

  if (Object.keys(updates).length === 0) {
    return { error: 'Nenhum campo valido para atualizar', status: 400 }
  }

  const { data, error } = await db
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return { error: error.message, status: 500 }
  }

  return { data }
}

/**
 * Deactivate user by setting status to 'inactive'.
 */
export async function deactivateUser(
  userId: string,
  supabase?: SupabaseClient,
): Promise<UserResult> {
  const db = supabase ?? createAdminClient()

  const { data, error } = await db
    .from('users')
    .update({ status: 'inactive' })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return { error: error.message, status: 500 }
  }

  return { data }
}

/**
 * Generate a password recovery link for a user.
 */
export async function resetUserPassword(
  userId: string,
  supabase?: SupabaseClient,
): Promise<MessageResult> {
  const db = supabase ?? createAdminClient()

  const { data: user, error: userError } = await db
    .from('users')
    .select('email, auth_user_id, law_firm_id')
    .eq('id', userId)
    .single()

  if (userError || !user?.email) {
    return { error: 'Usuario nao encontrado', status: 404 }
  }

  const { error: linkError } = await db.auth.admin.generateLink({
    type: 'recovery',
    email: user.email,
  })

  if (linkError) {
    return { error: linkError.message, status: 500 }
  }

  return { message: 'Link de recuperacao enviado para ' + user.email }
}

/**
 * Check if target user belongs to caller's firm.
 * Returns the target user data on success, or an error result.
 */
export async function verifyFirmOwnership(
  userId: string,
  callerFirmId: string,
  selectFields = 'law_firm_id',
  supabase?: SupabaseClient,
): Promise<{ data: Record<string, unknown> } | { error: string; status: number }> {
  const db = supabase ?? createAdminClient()

  const { data: targetUser, error } = await db
    .from('users')
    .select(selectFields)
    .eq('id', userId)
    .single()

  if (error || !targetUser) {
    return { error: 'Usuario nao encontrado', status: 404 }
  }

  const user = targetUser as unknown as Record<string, unknown>

  if (user.law_firm_id !== callerFirmId) {
    return { error: 'Acesso negado: usuario de outro escritorio', status: 403 }
  }

  return { data: user }
}
