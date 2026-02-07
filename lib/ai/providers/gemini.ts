import { createVertex } from '@ai-sdk/google-vertex'

export function createGeminiProvider() {
  const b64Credentials = process.env.VERTEX_CREDENTIALS
  if (!b64Credentials) {
    throw new Error('VERTEX_CREDENTIALS não configurada')
  }

  const credentials = JSON.parse(
    Buffer.from(b64Credentials, 'base64').toString('utf-8')
  )

  return createVertex({
    project: process.env.GOOGLE_VERTEX_PROJECT || credentials.project_id,
    location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
    googleAuthOptions: { credentials },
  })
}
