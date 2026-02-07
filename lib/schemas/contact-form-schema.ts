import { z } from 'zod'

// Step 1: Subject and basic info
export const step1Schema = z.object({
  subject: z.enum(['trabalhista', 'contratos', 'cobranca', 'consultoria', 'outro'], {
    required_error: 'Selecione o assunto',
  }),
  city: z.string().optional(),
  role: z.enum(['socio', 'diretor', 'rh', 'financeiro', 'outro']).optional(),
})

// Step 2: Company info
export const step2Schema = z.object({
  company_name: z.string().optional(),
  cnpj: z.string().optional(),
  employee_count: z.enum(['1-10', '11-50', '51-200', '200+']).optional(),
  segment: z.string().optional(),
})

// Step 3: Urgency and details
export const step3Schema = z.object({
  urgency: z.enum(['urgente', 'normal', 'consulta'], {
    required_error: 'Selecione a urgencia',
  }),
  details: z.object({
    description: z.string().optional(),
  }).optional(),
})

// Step 4: Contact info
export const step4Schema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio'),
  email: z.string().email('E-mail invalido'),
  phone: z.string().min(1, 'Telefone e obrigatorio'),
  preferred_channel: z.enum(['whatsapp', 'email', 'telefone']).optional(),
  preferred_time: z.enum(['manha', 'tarde', 'sem_preferencia']).optional(),
})

// Step 5: Consent
export const step5Schema = z.object({
  privacy_consent: z.literal(true, {
    errorMap: () => ({ message: 'Voce deve aceitar a politica de privacidade' }),
  }),
  marketing_consent: z.boolean().optional(),
})

// Full schema combining all steps
export const contactFormSchema = z.object({
  // Step 1
  subject: z.enum(['trabalhista', 'contratos', 'cobranca', 'consultoria', 'outro']),
  city: z.string().optional(),
  role: z.enum(['socio', 'diretor', 'rh', 'financeiro', 'outro']).optional(),
  // Step 2
  company_name: z.string().optional(),
  cnpj: z.string().optional(),
  employee_count: z.enum(['1-10', '11-50', '51-200', '200+']).optional(),
  segment: z.string().optional(),
  // Step 3
  urgency: z.enum(['urgente', 'normal', 'consulta']),
  details: z.object({
    description: z.string().optional(),
  }).optional(),
  // Step 4
  name: z.string().min(1, 'Nome e obrigatorio'),
  email: z.string().email('E-mail invalido'),
  phone: z.string().min(1, 'Telefone e obrigatorio'),
  preferred_channel: z.enum(['whatsapp', 'email', 'telefone']).optional(),
  preferred_time: z.enum(['manha', 'tarde', 'sem_preferencia']).optional(),
  // Step 5
  marketing_consent: z.boolean().optional(),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
export type Step4Data = z.infer<typeof step4Schema>
export type Step5Data = z.infer<typeof step5Schema>
export type ContactFormData = z.infer<typeof contactFormSchema>
