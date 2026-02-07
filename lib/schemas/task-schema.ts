import { z } from 'zod'

export const taskSchema = z.object({
  law_firm_id: z.string().uuid().optional(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  matter_id: z.string().optional(),
  task_type: z.enum(['general', 'deadline', 'court_date', 'client_meeting', 'document_review']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  due_date: z.string().optional(),
  assigned_to: z.string().optional(),
  is_billable: z.boolean().optional(),
  estimated_hours: z.coerce.number().min(0).optional(),
})

export type TaskFormData = z.infer<typeof taskSchema>
