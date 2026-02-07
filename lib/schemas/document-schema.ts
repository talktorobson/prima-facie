import { z } from 'zod'

export const documentSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  matter_id: z.string().optional(),
  contact_id: z.string().optional(),
  document_type: z.string().optional(),
  category: z.string().optional(),
  access_level: z.enum(['public', 'internal', 'restricted', 'confidential']).optional(),
  is_confidential: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
})

export type DocumentFormData = z.infer<typeof documentSchema>
