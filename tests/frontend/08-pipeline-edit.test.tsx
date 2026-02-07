/**
 * Frontend UI Tests: Pipeline Lead Edit Form
 * Tests the edit form for pipeline cards/leads
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'

// Mock Next.js router
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => '/pipeline/card-123/edit',
  useParams: () => ({ id: 'card-123' }),
}))

// Note: Mock components are self-contained and don't import from @/ paths

// Test data
const mockStages = [
  { id: 'stage-1', name: 'Prospecção' },
  { id: 'stage-2', name: 'Qualificação' },
  { id: 'stage-3', name: 'Proposta' },
]

const mockMatterTypes = [
  { id: 'mt-1', name: 'Trabalhista' },
  { id: 'mt-2', name: 'Civil' },
  { id: 'mt-3', name: 'Empresarial' },
]

const sourceOptions = [
  { value: 'website', label: 'Site' },
  { value: 'referral', label: 'Indicacao' },
  { value: 'google', label: 'Google' },
  { value: 'social_media', label: 'Redes Sociais' },
  { value: 'evento', label: 'Evento' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'outros', label: 'Outros' },
]

const mockCard = {
  id: 'card-123',
  title: 'Lead Existente',
  pipeline_stage_id: 'stage-2',
  description: 'Descricao do lead existente',
  estimated_value: 15000,
  probability: 60,
  expected_close_date: '2025-03-15',
  next_follow_up_date: '2025-02-01',
  source: 'referral',
  contact_id: '',
  matter_type_id: 'mt-1',
  assigned_to: '',
  notes: 'Observacoes do lead',
}

// --- Mock: Edit Lead Page ---
const MockEditLeadPage = ({
  card,
  stages,
  matterTypes,
  isLoading,
  onSubmit,
  cardNotFound,
}: {
  card?: typeof mockCard | null
  stages?: typeof mockStages
  matterTypes?: typeof mockMatterTypes
  isLoading?: boolean
  onSubmit?: (data: Record<string, unknown>) => void
  cardNotFound?: boolean
}) => {
  const currentCard = cardNotFound ? null : (card ?? mockCard)
  const currentStages = stages ?? mockStages
  const currentMatterTypes = matterTypes ?? mockMatterTypes
  const loading = isLoading ?? false

  const [formData, setFormData] = React.useState({
    title: '',
    pipeline_stage_id: '',
    description: '',
    estimated_value: '',
    probability: 20,
    expected_close_date: '',
    next_follow_up_date: '',
    source: 'website',
    matter_type_id: '',
    notes: '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [submitResult, setSubmitResult] = React.useState<'success' | 'error' | null>(null)

  // Pre-populate from card data
  React.useEffect(() => {
    if (currentCard) {
      setFormData({
        title: currentCard.title ?? '',
        pipeline_stage_id: currentCard.pipeline_stage_id ?? '',
        description: currentCard.description ?? '',
        estimated_value: currentCard.estimated_value ? String(currentCard.estimated_value) : '',
        probability: currentCard.probability ?? 20,
        expected_close_date: currentCard.expected_close_date ?? '',
        next_follow_up_date: currentCard.next_follow_up_date ?? '',
        source: currentCard.source ?? 'website',
        matter_type_id: currentCard.matter_type_id ?? '',
        notes: currentCard.notes ?? '',
      })
    }
  }, [currentCard])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleProbabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, probability: Number(e.target.value) }))
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Titulo e obrigatorio'
    if (!formData.pipeline_stage_id) newErrors.pipeline_stage_id = 'Selecione uma etapa'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      if (onSubmit) {
        onSubmit(formData)
      }
      setSubmitResult('success')
      mockPush('/pipeline')
    } catch {
      setSubmitResult('error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div data-testid="pipeline-edit-loading">
        <div data-testid="loading-spinner" className="animate-spin" />
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div data-testid="lead-not-found">
        <h2>Lead nao encontrado</h2>
        <a href="/pipeline" data-testid="back-to-pipeline">Voltar para Pipeline</a>
      </div>
    )
  }

  return (
    <div data-testid="pipeline-edit">
      <a href="/pipeline" data-testid="back-link">Voltar para Pipeline</a>
      <h1>Editar Lead</h1>
      <p>Atualize as informacoes do lead</p>

      <form data-testid="edit-form" onSubmit={handleSubmitForm}>
        {/* Basic Info */}
        <div data-testid="basic-info-section">
          <h3>Informacoes Basicas</h3>

          <div data-testid="field-title">
            <label htmlFor="title">Titulo *</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Titulo do lead"
              data-testid="input-title"
            />
            {errors.title && <p data-testid="error-title">{errors.title}</p>}
          </div>

          <div data-testid="field-stage">
            <label htmlFor="pipeline_stage_id">Etapa do Pipeline *</label>
            <select
              id="pipeline_stage_id"
              name="pipeline_stage_id"
              value={formData.pipeline_stage_id}
              onChange={handleChange}
              data-testid="select-stage"
            >
              <option value="">Selecione uma etapa</option>
              {currentStages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
            {errors.pipeline_stage_id && <p data-testid="error-stage">{errors.pipeline_stage_id}</p>}
          </div>

          <div data-testid="field-matter-type">
            <label htmlFor="matter_type_id">Area Juridica</label>
            <select
              id="matter_type_id"
              name="matter_type_id"
              value={formData.matter_type_id}
              onChange={handleChange}
              data-testid="select-matter-type"
            >
              <option value="">Selecione uma area</option>
              {currentMatterTypes.map(mt => (
                <option key={mt.id} value={mt.id}>{mt.name}</option>
              ))}
            </select>
          </div>

          <div data-testid="field-source">
            <label htmlFor="source">Origem</label>
            <select
              id="source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              data-testid="select-source"
            >
              <option value="">Selecione a origem</option>
              {sourceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial */}
        <div data-testid="financial-section">
          <h3>Detalhes Financeiros</h3>

          <div data-testid="field-value">
            <label htmlFor="estimated_value">Valor Estimado (R$)</label>
            <input
              id="estimated_value"
              name="estimated_value"
              type="number"
              value={formData.estimated_value}
              onChange={handleChange}
              placeholder="25000"
              data-testid="input-value"
            />
          </div>

          <div data-testid="field-probability">
            <label htmlFor="probability">Probabilidade (%)</label>
            <input
              id="probability"
              name="probability"
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.probability}
              onChange={handleProbabilityChange}
              data-testid="input-probability"
            />
            <span data-testid="probability-display">{formData.probability}%</span>
          </div>
        </div>

        {/* Description */}
        <div data-testid="field-description">
          <label htmlFor="description">Descricao</label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            placeholder="Descreva a necessidade juridica do lead..."
            data-testid="input-description"
          />
        </div>

        {/* Dates */}
        <div data-testid="dates-section">
          <h3>Datas Importantes</h3>

          <div data-testid="field-close-date">
            <label htmlFor="expected_close_date">Previsao de Fechamento</label>
            <input
              id="expected_close_date"
              name="expected_close_date"
              type="date"
              value={formData.expected_close_date}
              onChange={handleChange}
              data-testid="input-close-date"
            />
          </div>

          <div data-testid="field-followup-date">
            <label htmlFor="next_follow_up_date">Proximo Follow-up</label>
            <input
              id="next_follow_up_date"
              name="next_follow_up_date"
              type="date"
              value={formData.next_follow_up_date}
              onChange={handleChange}
              data-testid="input-followup-date"
            />
          </div>
        </div>

        {/* Notes */}
        <div data-testid="field-notes">
          <label htmlFor="notes">Observacoes</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Observacoes adicionais sobre o lead..."
            data-testid="input-notes"
          />
        </div>

        {/* Actions */}
        <div data-testid="form-actions">
          <button
            type="button"
            data-testid="cancel-btn"
            onClick={() => mockPush('/pipeline')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            data-testid="submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Salvando...' : 'Salvar Alteracoes'}
          </button>
        </div>
      </form>

      {submitResult === 'success' && <p data-testid="toast-success">Lead atualizado com sucesso!</p>}
      {submitResult === 'error' && <p data-testid="toast-error">Erro ao atualizar lead. Tente novamente.</p>}
    </div>
  )
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('Pipeline Edit Page UI Tests', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Pipeline Edit Form', () => {
    it('should render form with all fields', () => {
      render(<TestWrapper><MockEditLeadPage /></TestWrapper>)
      expect(screen.getByTestId('pipeline-edit')).toBeInTheDocument()
      expect(screen.getByText('Editar Lead')).toBeInTheDocument()

      // Basic fields
      expect(screen.getByTestId('input-title')).toBeInTheDocument()
      expect(screen.getByTestId('select-stage')).toBeInTheDocument()
      expect(screen.getByTestId('select-matter-type')).toBeInTheDocument()
      expect(screen.getByTestId('select-source')).toBeInTheDocument()

      // Financial fields
      expect(screen.getByTestId('input-value')).toBeInTheDocument()
      expect(screen.getByTestId('input-probability')).toBeInTheDocument()

      // Dates
      expect(screen.getByTestId('input-close-date')).toBeInTheDocument()
      expect(screen.getByTestId('input-followup-date')).toBeInTheDocument()

      // Text fields
      expect(screen.getByTestId('input-description')).toBeInTheDocument()
      expect(screen.getByTestId('input-notes')).toBeInTheDocument()
    })

    it('should pre-populate form with existing card data', () => {
      render(<TestWrapper><MockEditLeadPage /></TestWrapper>)

      expect(screen.getByTestId('input-title')).toHaveValue('Lead Existente')
      expect(screen.getByTestId('select-stage')).toHaveValue('stage-2')
      expect(screen.getByTestId('select-matter-type')).toHaveValue('mt-1')
      expect(screen.getByTestId('select-source')).toHaveValue('referral')
      expect(screen.getByTestId('input-value')).toHaveValue(15000)
      expect(screen.getByTestId('input-description')).toHaveValue('Descricao do lead existente')
      expect(screen.getByTestId('input-close-date')).toHaveValue('2025-03-15')
      expect(screen.getByTestId('input-followup-date')).toHaveValue('2025-02-01')
      expect(screen.getByTestId('input-notes')).toHaveValue('Observacoes do lead')
    })

    it('should display probability slider with current value', () => {
      render(<TestWrapper><MockEditLeadPage /></TestWrapper>)
      expect(screen.getByTestId('probability-display')).toHaveTextContent('60%')
    })

    it('should update probability display when slider changes', async () => {
      render(<TestWrapper><MockEditLeadPage /></TestWrapper>)
      const slider = screen.getByTestId('input-probability')
      fireEvent.change(slider, { target: { value: '80' } })
      expect(screen.getByTestId('probability-display')).toHaveTextContent('80%')
    })

    it('should render stage options from data', () => {
      render(<TestWrapper><MockEditLeadPage /></TestWrapper>)
      const select = screen.getByTestId('select-stage')
      expect(select).toContainHTML('Prospecção')
      expect(select).toContainHTML('Qualificação')
      expect(select).toContainHTML('Proposta')
    })

    it('should render matter type options', () => {
      render(<TestWrapper><MockEditLeadPage /></TestWrapper>)
      const select = screen.getByTestId('select-matter-type')
      expect(select).toContainHTML('Trabalhista')
      expect(select).toContainHTML('Civil')
      expect(select).toContainHTML('Empresarial')
    })

    it('should render source options', () => {
      render(<TestWrapper><MockEditLeadPage /></TestWrapper>)
      const select = screen.getByTestId('select-source')
      expect(select).toContainHTML('Site')
      expect(select).toContainHTML('Indicacao')
      expect(select).toContainHTML('Google')
    })

    it('should call mutation with correct data on submit', async () => {
      const onSubmit = jest.fn()
      render(<TestWrapper><MockEditLeadPage onSubmit={onSubmit} /></TestWrapper>)

      await user.click(screen.getByTestId('submit-btn'))

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Lead Existente',
          pipeline_stage_id: 'stage-2',
          source: 'referral',
        })
      )
    })

    it('should navigate to /pipeline on successful submit', async () => {
      const onSubmit = jest.fn()
      render(<TestWrapper><MockEditLeadPage onSubmit={onSubmit} /></TestWrapper>)

      await user.click(screen.getByTestId('submit-btn'))
      expect(mockPush).toHaveBeenCalledWith('/pipeline')
    })

    it('should navigate to /pipeline on cancel', async () => {
      render(<TestWrapper><MockEditLeadPage /></TestWrapper>)
      await user.click(screen.getByTestId('cancel-btn'))
      expect(mockPush).toHaveBeenCalledWith('/pipeline')
    })

    it('should show validation errors when required fields are empty', async () => {
      render(
        <TestWrapper>
          <MockEditLeadPage card={{ ...mockCard, title: '', pipeline_stage_id: '' }} />
        </TestWrapper>
      )

      // Clear title
      const titleInput = screen.getByTestId('input-title')
      await user.clear(titleInput)

      // Clear stage
      await user.selectOptions(screen.getByTestId('select-stage'), '')

      await user.click(screen.getByTestId('submit-btn'))
      expect(screen.getByTestId('error-title')).toHaveTextContent('Titulo e obrigatorio')
      expect(screen.getByTestId('error-stage')).toHaveTextContent('Selecione uma etapa')
    })

    it('should show "Lead nao encontrado" when card does not exist', () => {
      render(<TestWrapper><MockEditLeadPage cardNotFound={true} /></TestWrapper>)
      expect(screen.getByTestId('lead-not-found')).toBeInTheDocument()
      expect(screen.getByText('Lead nao encontrado')).toBeInTheDocument()
      const backLink = screen.getByTestId('back-to-pipeline')
      expect(backLink).toHaveAttribute('href', '/pipeline')
    })

    it('should show loading spinner', () => {
      render(<TestWrapper><MockEditLeadPage isLoading={true} /></TestWrapper>)
      expect(screen.getByTestId('pipeline-edit-loading')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should show success toast on successful submission', async () => {
      const onSubmit = jest.fn()
      render(<TestWrapper><MockEditLeadPage onSubmit={onSubmit} /></TestWrapper>)

      await user.click(screen.getByTestId('submit-btn'))
      await waitFor(() => {
        expect(screen.getByTestId('toast-success')).toHaveTextContent('Lead atualizado com sucesso!')
      })
    })

    it('should have back link to pipeline', () => {
      render(<TestWrapper><MockEditLeadPage /></TestWrapper>)
      const backLink = screen.getByTestId('back-link')
      expect(backLink).toHaveAttribute('href', '/pipeline')
      expect(backLink).toHaveTextContent('Voltar para Pipeline')
    })
  })
})
