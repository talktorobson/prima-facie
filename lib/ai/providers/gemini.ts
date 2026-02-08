import { createVertex } from '@ai-sdk/google-vertex'

export function createGeminiProvider() {
  const b64Credentials = process.env.VERTEX_CREDENTIALS
  const project = process.env.GOOGLE_VERTEX_PROJECT
  const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1'

  // Base64-encoded service account JSON (production)
  if (b64Credentials) {
    const credentials = JSON.parse(
      Buffer.from(b64Credentials, 'base64').toString('utf-8')
    )
    return createVertex({
      project: project || credentials.project_id,
      location,
      googleAuthOptions: { credentials },
    })
  }

  // Fall back to Application Default Credentials (local dev: gcloud auth application-default login)
  if (!project) {
    throw new Error(
      'VERTEX_CREDENTIALS ou GOOGLE_VERTEX_PROJECT não configurada. ' +
      'Para dev local use: gcloud auth application-default login && export GOOGLE_VERTEX_PROJECT=<project>'
    )
  }

  return createVertex({ project, location })
}
