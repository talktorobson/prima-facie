import { z } from 'zod'

const baseContactSchema = z.object({
  contact_type: z.enum(['individual', 'company']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zipcode: z.string().optional(),
  client_status: z.enum(['prospect', 'active', 'inactive', 'former']).optional(),
  preferred_communication: z.enum(['email', 'phone', 'whatsapp', 'mail']).optional(),
  notes: z.string().optional(),
})

const individualSchema = baseContactSchema.extend({
  contact_type: z.literal('individual'),
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().min(1, 'Sobrenome é obrigatório'),
  cpf: z.string()
    .optional()
    .refine(
      (val) => !val || /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/.test(val),
      'CPF inválido (use formato 000.000.000-00)'
    ),
  rg: z.string().optional(),
  birth_date: z.string().optional(),
  marital_status: z.string().optional(),
  profession: z.string().optional(),
  company_name: z.string().optional(),
  cnpj: z.string().optional(),
})

const companySchema = baseContactSchema.extend({
  contact_type: z.literal('company'),
  company_name: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z.string()
    .optional()
    .refine(
      (val) => !val || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/.test(val),
      'CNPJ inválido (use formato 00.000.000/0000-00)'
    ),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birth_date: z.string().optional(),
  marital_status: z.string().optional(),
  profession: z.string().optional(),
})

export const contactSchema = z.discriminatedUnion('contact_type', [
  individualSchema,
  companySchema,
])

export type ContactFormData = z.infer<typeof contactSchema>
