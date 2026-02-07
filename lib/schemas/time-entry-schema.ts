import { z } from 'zod'

export const timeEntrySchema = z.object({
  matter_id: z.string().min(1, 'Processo é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  hours_worked: z.coerce.number().min(0.1, 'Horas trabalhadas deve ser maior que 0'),
  work_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  hourly_rate: z.coerce.number().min(0).optional(),
  is_billable: z.boolean().optional(),
})

export type TimeEntryFormData = z.infer<typeof timeEntrySchema>
