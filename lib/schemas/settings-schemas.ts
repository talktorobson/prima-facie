import { z } from 'zod'

export const lawFirmSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  legal_name: z.string().optional(),
  cnpj: z.string().optional(),
  oab_number: z.string().optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  website: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zipcode: z.string().optional(),
})

export const matterTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
  default_hourly_rate: z.coerce.number().min(0).optional(),
  default_flat_fee: z.coerce.number().min(0).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.coerce.number().int().min(0).optional(),
})

export const userManagementSchema = z.object({
  email: z.string().email('Email inválido'),
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().min(1, 'Sobrenome é obrigatório'),
  user_type: z.enum(['admin', 'lawyer', 'staff', 'client']),
  oab_number: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
})

export const userCreateSchema = userManagementSchema.extend({
  password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
  password_confirmation: z.string().optional(),
}).refine(
  (data) => !data.password_confirmation || data.password === data.password_confirmation,
  { message: 'As senhas nao coincidem', path: ['password_confirmation'] }
)

export type LawFirmFormData = z.infer<typeof lawFirmSchema>
export type MatterTypeFormData = z.infer<typeof matterTypeSchema>
export type UserManagementFormData = z.infer<typeof userManagementSchema>
export type UserCreateFormData = z.infer<typeof userCreateSchema>
