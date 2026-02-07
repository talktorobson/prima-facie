import { z } from 'zod'

export const pipelineCardSchema = z.object({
  pipeline_stage_id: z.string().min(1, 'Etapa é obrigatória'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  contact_id: z.string().optional(),
  matter_type_id: z.string().optional(),
  estimated_value: z.coerce.number().min(0).optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  expected_close_date: z.string().optional(),
  next_follow_up_date: z.string().optional(),
  assigned_to: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
})

export type PipelineCardFormData = z.infer<typeof pipelineCardSchema>
