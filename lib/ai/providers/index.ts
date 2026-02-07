import type { LanguageModel } from 'ai'
import { createGeminiProvider } from './gemini'
import { AI_CONFIG, type AIProvider } from '../config'

export function getProvider(name?: AIProvider): LanguageModel {
  const providerName = name || AI_CONFIG.defaultProvider
  const modelId = AI_CONFIG.defaultModel

  switch (providerName) {
    case 'google': {
      const google = createGeminiProvider()
      return google(modelId)
    }
    default:
      throw new Error(`Provedor de IA "${providerName}" não suportado`)
  }
}
