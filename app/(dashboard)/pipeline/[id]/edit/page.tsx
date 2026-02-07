'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeftIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { usePipelineStages, usePipelineCards, useUpdatePipelineCard } from '@/lib/queries/usePipeline'
import { useMatterTypes } from '@/lib/queries/useSettings'
import { useToast } from '@/components/ui/toast-provider'
import { pipelineCardSchema, type PipelineCardFormData } from '@/lib/schemas/pipeline-schema'
import { useEffect } from 'react'

const sourceOptions = [
  { value: 'website', label: 'Site' },
  { value: 'referral', label: 'Indicacao' },
  { value: 'google', label: 'Google' },
  { value: 'social_media', label: 'Redes Sociais' },
  { value: 'evento', label: 'Evento' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'outros', label: 'Outros' },
]

export default function EditLeadPage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const router = useRouter()
  const params = useParams()
  const toast = useToast()
  const cardId = params.id as string

  const { data: stages = [], isLoading: stagesLoading } = usePipelineStages()
  const { data: matterTypes = [], isLoading: matterTypesLoading } = useMatterTypes()
  const { data: allCards = [], isLoading: cardsLoading } = usePipelineCards()
  const updateCard = useUpdatePipelineCard()

  const card = allCards.find((c) => c.id === cardId)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PipelineCardFormData>({
    resolver: zodResolver(pipelineCardSchema),
    defaultValues: {
      pipeline_stage_id: '',
      title: '',
      description: '',
      estimated_value: undefined,
      probability: 20,
      expected_close_date: '',
      next_follow_up_date: '',
      source: 'website',
      notes: '',
    },
  })

  useEffect(() => {
    if (card) {
      reset({
        pipeline_stage_id: card.pipeline_stage_id ?? '',
        title: card.title ?? '',
        description: card.description ?? '',
        estimated_value: card.estimated_value ?? undefined,
        probability: card.probability ?? 20,
        expected_close_date: card.expected_close_date ?? '',
        next_follow_up_date: card.next_follow_up_date ?? '',
        source: card.source ?? 'website',
        contact_id: card.contact_id ?? '',
        matter_type_id: card.matter_type_id ?? '',
        assigned_to: card.assigned_to ?? '',
        notes: card.notes ?? '',
      })
    }
  }, [card, reset])

  const probabilityValue = watch('probability') ?? 0

  const onSubmit = async (data: PipelineCardFormData) => {
    if (!effectiveLawFirmId) {
      toast.error('Escritorio nao configurado. Faca login novamente.')
      return
    }

    try {
      await updateCard.mutateAsync({
        id: cardId,
        updates: {
          ...data,
          estimated_value: data.estimated_value ?? undefined,
          expected_close_date: data.expected_close_date || undefined,
          next_follow_up_date: data.next_follow_up_date || undefined,
          contact_id: data.contact_id || undefined,
          matter_type_id: data.matter_type_id || undefined,
          assigned_to: data.assigned_to || undefined,
          notes: data.notes || undefined,
        },
      })
      toast.success('Lead atualizado com sucesso!')
      router.push('/pipeline')
    } catch {
      toast.error('Erro ao atualizar lead. Tente novamente.')
    }
  }

  const isLoadingDeps = stagesLoading || matterTypesLoading || cardsLoading

  if (isLoadingDeps) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!card) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-medium text-gray-900">Lead nao encontrado</h2>
        <Link href="/pipeline" className="text-primary hover:underline mt-2 inline-block">
          Voltar para Pipeline
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/pipeline"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Voltar para Pipeline
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Lead</h1>
        <p className="mt-2 text-gray-600">
          Atualize as informacoes do lead
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Informacoes Basicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Titulo *
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="title"
                    {...register('title')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Titulo do lead"
                  />
                  <UserIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
                </div>
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="pipeline_stage_id" className="block text-sm font-medium text-gray-700">
                  Etapa do Pipeline *
                </label>
                <select
                  id="pipeline_stage_id"
                  {...register('pipeline_stage_id')}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                    errors.pipeline_stage_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione uma etapa</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                {errors.pipeline_stage_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.pipeline_stage_id.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="matter_type_id" className="block text-sm font-medium text-gray-700">
                  Area Juridica
                </label>
                <select
                  id="matter_type_id"
                  {...register('matter_type_id')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Selecione uma area</option>
                  {matterTypes.map((mt) => (
                    <option key={mt.id} value={mt.id}>
                      {mt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Origem
                </label>
                <select
                  id="source"
                  {...register('source')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  <option value="">Selecione a origem</option>
                  {sourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Detalhes Financeiros
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="estimated_value" className="block text-sm font-medium text-gray-700">
                  Valor Estimado (R$)
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    id="estimated_value"
                    {...register('estimated_value')}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                      errors.estimated_value ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="25000"
                    min="0"
                    step="100"
                  />
                  <CurrencyDollarIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
                </div>
                {errors.estimated_value && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimated_value.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="probability" className="block text-sm font-medium text-gray-700">
                  Probabilidade (%)
                </label>
                <input
                  type="range"
                  id="probability"
                  {...register('probability', { valueAsNumber: true })}
                  className="mt-1 block w-full"
                  min="0"
                  max="100"
                  step="5"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="font-medium">{probabilityValue}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descricao
            </label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Descreva a necessidade juridica do lead..."
            />
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Datas Importantes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="expected_close_date" className="block text-sm font-medium text-gray-700">
                  Previsao de Fechamento
                </label>
                <div className="mt-1 relative">
                  <input
                    type="date"
                    id="expected_close_date"
                    {...register('expected_close_date')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  <CalendarIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="next_follow_up_date" className="block text-sm font-medium text-gray-700">
                  Proximo Follow-up
                </label>
                <div className="mt-1 relative">
                  <input
                    type="date"
                    id="next_follow_up_date"
                    {...register('next_follow_up_date')}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  <CalendarIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Observacoes
            </label>
            <textarea
              id="notes"
              rows={3}
              {...register('notes')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Observacoes adicionais sobre o lead..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/pipeline')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Salvar Alteracoes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
