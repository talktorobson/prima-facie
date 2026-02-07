export const AI_CONFIG = {
  defaultProvider: 'google' as const,
  defaultModel: process.env.AI_DEFAULT_MODEL || 'gemini-2.0-flash',
  maxTokens: 4096,
  temperature: 0.7,
  maxHistoryMessages: 50,
  rateLimits: {
    messagesPerMinute: 30,
    messagesPerDay: 500,
  },
} as const

export type AIProvider = 'google' | 'anthropic' | 'openai'
