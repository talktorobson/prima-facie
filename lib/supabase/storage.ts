import { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_BUCKET = 'documents'

export async function uploadFile(
  supabase: SupabaseClient,
  bucket: string = DEFAULT_BUCKET,
  path: string,
  file: File
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) throw error
  return data
}

export async function downloadFile(
  supabase: SupabaseClient,
  bucket: string = DEFAULT_BUCKET,
  path: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path)

  if (error) throw error
  return data
}

export async function deleteFile(
  supabase: SupabaseClient,
  bucket: string = DEFAULT_BUCKET,
  path: string
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) throw error
  return data
}

export async function getSignedUrl(
  supabase: SupabaseClient,
  bucket: string = DEFAULT_BUCKET,
  path: string,
  expiresIn: number = 3600
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) throw error
  return data.signedUrl
}

export function getStoragePath(
  lawFirmId: string,
  matterId: string | undefined,
  documentId: string,
  filename: string
): string {
  return `${lawFirmId}/${matterId || 'general'}/${documentId}/${filename}`
}
