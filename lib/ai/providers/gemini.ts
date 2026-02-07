import { createGoogleGenerativeAI } from '@ai-sdk/google'

export function createGeminiProvider() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_GENERATIVE_AI_API_KEY não configurada')
  }
  return createGoogleGenerativeAI({ apiKey })
}
