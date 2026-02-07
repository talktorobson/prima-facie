'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateMatter } from '@/lib/queries/useMatters'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  FormProvider,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'

function formatCnj(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 20)
  const d = digits
  if (d.length <= 7) return d
  if (d.length <= 9) return `${d.slice(0, 7)}-${d.slice(7)}`
  if (d.length <= 13) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9)}`
  if (d.length <= 14) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13)}`
  if (d.length <= 16) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14)}`
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16)}`
}

const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/

const matterSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  case_number: z.string().optional().refine(
    (val) => !val || val === '' || CNJ_REGEX.test(val),
    { message: 'Formato CNJ inválido. Use: NNNNNNN-NN.NNNN.N.NN.NNNN' }
  ),
  description: z.string().optional(),
  status: z.enum(['active', 'closed', 'on_hold', 'settled', 'dismissed']),
  matter_type_id: z.string().uuid('Selecione um tipo de processo'),
})

type MatterFormData = z.infer<typeof matterSchema>

interface CreateMatterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock matter types - in production, fetch from useQuery
const MATTER_TYPES = [
  { value: '00000000-0000-0000-0000-000000000001', label: 'Cível' },
  { value: '00000000-0000-0000-0000-000000000002', label: 'Trabalhista' },
  { value: '00000000-0000-0000-0000-000000000003', label: 'Criminal' },
  { value: '00000000-0000-0000-0000-000000000004', label: 'Família' },
  { value: '00000000-0000-0000-0000-000000000005', label: 'Tributário' },
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Ativo' },
  { value: 'on_hold', label: 'Em espera' },
  { value: 'closed', label: 'Encerrado' },
  { value: 'settled', label: 'Acordo' },
  { value: 'dismissed', label: 'Arquivado' },
]

export function CreateMatterDialog({ open, onOpenChange }: CreateMatterDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const createMatter = useCreateMatter()

  const form = useForm<MatterFormData>({
    resolver: zodResolver(matterSchema),
    defaultValues: {
      title: '',
      case_number: '',
      description: '',
      status: 'active',
      matter_type_id: '',
    },
  })

  const onSubmit = async (data: MatterFormData) => {
    setError(null)

    try {
      await createMatter.mutateAsync({
        title: data.title,
        case_number: data.case_number || null,
        description: data.description || null,
        status: data.status,
        matter_type_id: data.matter_type_id,
        // These would normally come from the authenticated user's context
        law_firm_id: '00000000-0000-0000-0000-000000000000', // Placeholder
        assigned_lawyer_id: null,
      })

      form.reset()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar processo')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Novo Processo</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo processo jurídico
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6 pt-0">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Título</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Ação de indenização por danos morais"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="case_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do Processo (CNJ)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="NNNNNNN-NN.NNNN.N.NN.NNNN"
                      className="font-mono"
                      maxLength={25}
                      {...field}
                      onChange={(e) => field.onChange(formatCnj(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Número CNJ ou identificação interna
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matter_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Tipo de Processo</FormLabel>
                  <FormControl>
                    <Controller
                      name="matter_type_id"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          options={MATTER_TYPES}
                          placeholder="Selecione o tipo"
                          error={!!form.formState.errors.matter_type_id}
                        />
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Status</FormLabel>
                  <FormControl>
                    <Controller
                      name="status"
                      control={form.control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          options={STATUS_OPTIONS}
                          error={!!form.formState.errors.status}
                        />
                      )}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Descreva os detalhes do processo..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                isLoading={form.formState.isSubmitting}
              >
                Criar Processo
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
