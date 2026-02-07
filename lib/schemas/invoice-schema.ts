import { z } from 'zod'

export const invoiceSchema = z.object({
  contact_id: z.string().min(1, 'Cliente é obrigatório'),
  matter_id: z.string().optional(),
  invoice_number: z.string().min(1, 'Número da fatura é obrigatório'),
  title: z.string().optional(),
  description: z.string().optional(),
  issue_date: z.string().optional(),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  subtotal: z.coerce.number().min(0).optional(),
  tax_rate: z.coerce.number().min(0).max(100).optional(),
  total_amount: z.coerce.number().min(0, 'Valor total é obrigatório'),
  status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
})

export const invoiceLineItemSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.coerce.number().min(0).optional(),
  rate: z.coerce.number().min(0, 'Valor unitário é obrigatório'),
  item_type: z.enum(['time', 'expense', 'fee', 'other']).optional(),
  service_date: z.string().optional(),
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>
export type InvoiceLineItemFormData = z.infer<typeof invoiceLineItemSchema>
