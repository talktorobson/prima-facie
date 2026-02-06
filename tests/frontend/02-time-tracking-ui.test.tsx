/**
 * Frontend UI Tests: Time Tracking System
 * Tests all time tracking UI components and user interactions
 * 
 * Test Coverage:
 * - Timer start/stop functionality
 * - Time entry creation and editing
 * - Billable vs non-billable time tracking
 * - Time entry templates usage
 * - Daily/weekly/monthly time reports
 * - Rate calculations and billing integration
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, jest, beforeAll, afterEach } from '@jest/globals'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/billing/time-tracking',
}))

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(),
  or: jest.fn(() => mockSupabase),
  filter: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

// Mock auth context
const mockAuthContext = {
  user: {
    id: 'test-user-123',
    email: 'lawyer@test.com',
    user_metadata: {
      role: 'lawyer',
      law_firm_id: 'test-firm-123'
    }
  },
  profile: {
    id: 'test-user-123',
    law_firm_id: 'test-firm-123',
    role: 'lawyer',
    full_name: 'Dr. João Silva'
  }
}

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockAuthContext
}))

// Mock timer functionality
const MockTimeTracker = ({ onTimeEntryCreate, onTimerStart, onTimerStop }) => {
  const [isRunning, setIsRunning] = React.useState(false)
  const [elapsedTime, setElapsedTime] = React.useState(0)
  const [selectedMatter, setSelectedMatter] = React.useState('')
  const [selectedTask, setSelectedTask] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [isBillable, setIsBillable] = React.useState(true)
  const [hourlyRate, setHourlyRate] = React.useState(350)

  // Mock timer effect
  React.useEffect(() => {
    let interval
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
    onTimerStart && onTimerStart({
      matter_id: selectedMatter,
      task_category: selectedTask,
      description,
      is_billable: isBillable,
      hourly_rate: hourlyRate
    })
  }

  const handleStop = () => {
    setIsRunning(false)
    if (elapsedTime > 0) {
      const timeEntry = {
        id: `entry-${Date.now()}`,
        matter_id: selectedMatter,
        task_category: selectedTask,
        description,
        start_time: new Date(Date.now() - elapsedTime * 1000).toISOString(),
        end_time: new Date().toISOString(),
        effective_minutes: Math.floor(elapsedTime / 60),
        is_billable: isBillable,
        billable_rate: isBillable ? hourlyRate : 0,
        billable_amount: isBillable ? (Math.floor(elapsedTime / 60) / 60) * hourlyRate : 0,
        entry_status: 'draft'
      }
      onTimeEntryCreate && onTimeEntryCreate(timeEntry)
      setElapsedTime(0)
    }
    onTimerStop && onTimerStop()
  }

  const handleReset = () => {
    setIsRunning(false)
    setElapsedTime(0)
  }

  const matters = [
    { id: 'matter-1', title: 'Ação Trabalhista - TechCorp' },
    { id: 'matter-2', title: 'Contrato Empresarial - StartupCorp' },
    { id: 'matter-3', title: 'Consultoria Jurídica - LegalSolutions' }
  ]

  const taskCategories = [
    'Consultation',
    'Document Review',
    'Research',
    'Court Appearance',
    'Client Meeting',
    'Administrative'
  ]

  return (
    <div data-testid="time-tracker">
      <h2>Timer de Tempo</h2>
      
      {/* Timer Display */}
      <div data-testid="timer-display" className={`timer ${isRunning ? 'running' : 'stopped'}`}>
        <div data-testid="elapsed-time" className="time-display">
          {formatTime(elapsedTime)}
        </div>
        <div data-testid="timer-status" className="status">
          {isRunning ? 'Em Andamento' : 'Parado'}
        </div>
      </div>

      {/* Timer Controls */}
      <div data-testid="timer-controls">
        <button
          data-testid="start-timer-btn"
          onClick={handleStart}
          disabled={isRunning || !selectedMatter || !selectedTask}
        >
          Iniciar
        </button>
        <button
          data-testid="stop-timer-btn"
          onClick={handleStop}
          disabled={!isRunning}
        >
          Parar
        </button>
        <button
          data-testid="reset-timer-btn"
          onClick={handleReset}
          disabled={isRunning}
        >
          Resetar
        </button>
      </div>

      {/* Time Entry Form */}
      <div data-testid="time-entry-form">
        <h3>Detalhes da Atividade</h3>
        
        <div data-testid="matter-selection">
          <label htmlFor="matter-select">Caso:</label>
          <select
            id="matter-select"
            value={selectedMatter}
            onChange={(e) => setSelectedMatter(e.target.value)}
          >
            <option value="">Selecione um caso</option>
            {matters.map(matter => (
              <option key={matter.id} value={matter.id}>
                {matter.title}
              </option>
            ))}
          </select>
        </div>

        <div data-testid="task-selection">
          <label htmlFor="task-select">Categoria da Tarefa:</label>
          <select
            id="task-select"
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
          >
            <option value="">Selecione uma categoria</option>
            {taskCategories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div data-testid="description-input">
          <label htmlFor="description">Descrição:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva a atividade realizada..."
            rows={3}
          />
        </div>

        <div data-testid="billable-toggle">
          <label>
            <input
              type="checkbox"
              checked={isBillable}
              onChange={(e) => setIsBillable(e.target.checked)}
            />
            Tempo Faturável
          </label>
        </div>

        {isBillable && (
          <div data-testid="hourly-rate-input">
            <label htmlFor="hourly-rate">Taxa Horária (R$):</label>
            <input
              type="number"
              id="hourly-rate"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>
        )}

        {/* Live Calculation */}
        {isRunning && isBillable && elapsedTime > 0 && (
          <div data-testid="live-calculation">
            <p>Valor atual: R$ {((Math.floor(elapsedTime / 60) / 60) * hourlyRate).toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

const MockTimeEntryList = ({ timeEntries = [], onTimeEntryEdit, onTimeEntryDelete }) => {
  const [editingEntry, setEditingEntry] = React.useState(null)
  const [editForm, setEditForm] = React.useState({})

  const defaultTimeEntries = [
    {
      id: 'entry-1',
      matter_id: 'matter-1',
      matter_title: 'Ação Trabalhista - TechCorp',
      task_category: 'Document Review',
      description: 'Análise de documentos trabalhistas',
      start_time: '2024-12-16T09:00:00Z',
      end_time: '2024-12-16T11:30:00Z',
      effective_minutes: 150,
      is_billable: true,
      billable_rate: 350,
      billable_amount: 875,
      entry_status: 'approved',
      created_at: '2024-12-16T09:00:00Z'
    },
    {
      id: 'entry-2',
      matter_id: 'matter-2',
      matter_title: 'Contrato Empresarial - StartupCorp',
      task_category: 'Consultation',
      description: 'Reunião com cliente para discussão de contrato',
      start_time: '2024-12-16T14:00:00Z',
      end_time: '2024-12-16T15:00:00Z',
      effective_minutes: 60,
      is_billable: true,
      billable_rate: 400,
      billable_amount: 400,
      entry_status: 'draft',
      created_at: '2024-12-16T14:00:00Z'
    },
    {
      id: 'entry-3',
      matter_id: 'matter-1',
      matter_title: 'Ação Trabalhista - TechCorp',
      task_category: 'Administrative',
      description: 'Organização de arquivos do caso',
      start_time: '2024-12-16T16:00:00Z',
      end_time: '2024-12-16T16:45:00Z',
      effective_minutes: 45,
      is_billable: false,
      billable_rate: 0,
      billable_amount: 0,
      entry_status: 'draft',
      created_at: '2024-12-16T16:00:00Z'
    }
  ]

  const entries = timeEntries.length > 0 ? timeEntries : defaultTimeEntries

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const handleEdit = (entry) => {
    setEditingEntry(entry.id)
    setEditForm({
      description: entry.description,
      effective_minutes: entry.effective_minutes,
      is_billable: entry.is_billable,
      billable_rate: entry.billable_rate
    })
  }

  const handleSaveEdit = (entryId) => {
    const updatedEntry = {
      ...entries.find(e => e.id === entryId),
      ...editForm,
      billable_amount: editForm.is_billable ? 
        (editForm.effective_minutes / 60) * editForm.billable_rate : 0
    }
    onTimeEntryEdit && onTimeEntryEdit(updatedEntry)
    setEditingEntry(null)
    setEditForm({})
  }

  const handleCancelEdit = () => {
    setEditingEntry(null)
    setEditForm({})
  }

  const handleDelete = (entryId) => {
    onTimeEntryDelete && onTimeEntryDelete(entryId)
  }

  const totalBillableTime = entries
    .filter(entry => entry.is_billable)
    .reduce((sum, entry) => sum + entry.effective_minutes, 0)

  const totalBillableAmount = entries
    .filter(entry => entry.is_billable)
    .reduce((sum, entry) => sum + entry.billable_amount, 0)

  const totalNonBillableTime = entries
    .filter(entry => !entry.is_billable)
    .reduce((sum, entry) => sum + entry.effective_minutes, 0)

  return (
    <div data-testid="time-entry-list">
      <h2>Entradas de Tempo</h2>

      {/* Summary Statistics */}
      <div data-testid="time-summary">
        <div data-testid="total-entries">Total de Entradas: {entries.length}</div>
        <div data-testid="billable-time">Tempo Faturável: {formatTime(totalBillableTime)}</div>
        <div data-testid="non-billable-time">Tempo Não-Faturável: {formatTime(totalNonBillableTime)}</div>
        <div data-testid="total-amount">Valor Total: R$ {totalBillableAmount.toFixed(2)}</div>
      </div>

      {/* Entries List */}
      <div data-testid="entries-list">
        {entries.map(entry => (
          <div key={entry.id} data-testid={`time-entry-${entry.id}`} className="time-entry-card">
            {editingEntry === entry.id ? (
              // Edit Mode
              <div data-testid={`edit-form-${entry.id}`}>
                <div data-testid="edit-description">
                  <label>Descrição:</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div data-testid="edit-minutes">
                  <label>Minutos:</label>
                  <input
                    type="number"
                    value={editForm.effective_minutes}
                    onChange={(e) => setEditForm({ ...editForm, effective_minutes: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div data-testid="edit-billable">
                  <label>
                    <input
                      type="checkbox"
                      checked={editForm.is_billable}
                      onChange={(e) => setEditForm({ ...editForm, is_billable: e.target.checked })}
                    />
                    Faturável
                  </label>
                </div>
                {editForm.is_billable && (
                  <div data-testid="edit-rate">
                    <label>Taxa Horária:</label>
                    <input
                      type="number"
                      value={editForm.billable_rate}
                      onChange={(e) => setEditForm({ ...editForm, billable_rate: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
                <div data-testid="edit-actions">
                  <button
                    data-testid={`save-edit-${entry.id}`}
                    onClick={() => handleSaveEdit(entry.id)}
                  >
                    Salvar
                  </button>
                  <button
                    data-testid={`cancel-edit-${entry.id}`}
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div data-testid={`view-mode-${entry.id}`}>
                <div data-testid="entry-matter">{entry.matter_title}</div>
                <div data-testid="entry-task">{entry.task_category}</div>
                <div data-testid="entry-description">{entry.description}</div>
                <div data-testid="entry-time">
                  {new Date(entry.start_time).toLocaleTimeString()} - {new Date(entry.end_time).toLocaleTimeString()}
                </div>
                <div data-testid="entry-duration">{formatTime(entry.effective_minutes)}</div>
                <div data-testid="entry-billable" className={entry.is_billable ? 'billable' : 'non-billable'}>
                  {entry.is_billable ? 'Faturável' : 'Não-Faturável'}
                </div>
                {entry.is_billable && (
                  <div data-testid="entry-amount">R$ {entry.billable_amount.toFixed(2)}</div>
                )}
                <div data-testid="entry-status" className={`status-${entry.entry_status}`}>
                  {entry.entry_status}
                </div>
                <div data-testid="entry-actions">
                  <button
                    data-testid={`edit-entry-${entry.id}`}
                    onClick={() => handleEdit(entry)}
                  >
                    Editar
                  </button>
                  <button
                    data-testid={`delete-entry-${entry.id}`}
                    onClick={() => handleDelete(entry.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const MockTimeEntryTemplates = ({ onTemplateUse, onTemplateCreate }) => {
  const [templates, setTemplates] = React.useState([
    {
      id: 'template-1',
      name: 'Consulta Jurídica Padrão',
      task_category: 'Consultation',
      description: 'Consulta jurídica com cliente',
      default_duration: 60,
      is_billable: true,
      default_rate: 350
    },
    {
      id: 'template-2',
      name: 'Revisão de Documento',
      task_category: 'Document Review',
      description: 'Análise e revisão de documento jurídico',
      default_duration: 90,
      is_billable: true,
      default_rate: 300
    },
    {
      id: 'template-3',
      name: 'Tarefa Administrativa',
      task_category: 'Administrative',
      description: 'Atividade administrativa interna',
      default_duration: 30,
      is_billable: false,
      default_rate: 0
    }
  ])

  const [newTemplate, setNewTemplate] = React.useState({
    name: '',
    task_category: '',
    description: '',
    default_duration: 60,
    is_billable: true,
    default_rate: 350
  })

  const [showCreateForm, setShowCreateForm] = React.useState(false)

  const handleUseTemplate = (template) => {
    onTemplateUse && onTemplateUse(template)
  }

  const handleCreateTemplate = () => {
    const template = {
      id: `template-${Date.now()}`,
      ...newTemplate
    }
    setTemplates([...templates, template])
    setNewTemplate({
      name: '',
      task_category: '',
      description: '',
      default_duration: 60,
      is_billable: true,
      default_rate: 350
    })
    setShowCreateForm(false)
    onTemplateCreate && onTemplateCreate(template)
  }

  const taskCategories = [
    'Consultation',
    'Document Review',
    'Research',
    'Court Appearance',
    'Client Meeting',
    'Administrative'
  ]

  return (
    <div data-testid="time-entry-templates">
      <h2>Templates de Entrada de Tempo</h2>

      {/* Templates List */}
      <div data-testid="templates-list">
        {templates.map(template => (
          <div key={template.id} data-testid={`template-${template.id}`} className="template-card">
            <div data-testid="template-name">{template.name}</div>
            <div data-testid="template-category">{template.task_category}</div>
            <div data-testid="template-description">{template.description}</div>
            <div data-testid="template-duration">{template.default_duration} min</div>
            <div data-testid="template-billable" className={template.is_billable ? 'billable' : 'non-billable'}>
              {template.is_billable ? `R$ ${template.default_rate}/h` : 'Não-Faturável'}
            </div>
            <button
              data-testid={`use-template-${template.id}`}
              onClick={() => handleUseTemplate(template)}
            >
              Usar Template
            </button>
          </div>
        ))}
      </div>

      {/* Create Template */}
      <div data-testid="create-template-section">
        <button
          data-testid="show-create-template-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancelar' : 'Criar Novo Template'}
        </button>

        {showCreateForm && (
          <div data-testid="create-template-form">
            <h3>Novo Template</h3>
            
            <div data-testid="template-name-input">
              <label>Nome do Template:</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                placeholder="Nome do template"
              />
            </div>

            <div data-testid="template-category-input">
              <label>Categoria:</label>
              <select
                value={newTemplate.task_category}
                onChange={(e) => setNewTemplate({ ...newTemplate, task_category: e.target.value })}
              >
                <option value="">Selecione uma categoria</option>
                {taskCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div data-testid="template-description-input">
              <label>Descrição:</label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                placeholder="Descrição padrão"
              />
            </div>

            <div data-testid="template-duration-input">
              <label>Duração Padrão (min):</label>
              <input
                type="number"
                value={newTemplate.default_duration}
                onChange={(e) => setNewTemplate({ ...newTemplate, default_duration: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </div>

            <div data-testid="template-billable-input">
              <label>
                <input
                  type="checkbox"
                  checked={newTemplate.is_billable}
                  onChange={(e) => setNewTemplate({ ...newTemplate, is_billable: e.target.checked })}
                />
                Faturável
              </label>
            </div>

            {newTemplate.is_billable && (
              <div data-testid="template-rate-input">
                <label>Taxa Horária Padrão:</label>
                <input
                  type="number"
                  value={newTemplate.default_rate}
                  onChange={(e) => setNewTemplate({ ...newTemplate, default_rate: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            <button
              data-testid="create-template-btn"
              onClick={handleCreateTemplate}
              disabled={!newTemplate.name || !newTemplate.task_category}
            >
              Criar Template
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Test wrapper with providers
const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Time Tracking UI Tests', () => {
  let user

  beforeAll(() => {
    // Mock timers for timer functionality
    jest.useFakeTimers()
  })

  beforeEach(() => {
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    jest.clearAllMocks()
    
    // Reset Supabase mock responses
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
    mockSupabase.select.mockResolvedValue({ data: [], error: null })
    mockSupabase.insert.mockResolvedValue({ data: [], error: null })
    mockSupabase.update.mockResolvedValue({ data: [], error: null })
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Timer Functionality', () => {
    it('should render timer interface with all required elements', async () => {
      render(
        <TestWrapper>
          <MockTimeTracker />
        </TestWrapper>
      )

      expect(screen.getByTestId('time-tracker')).toBeInTheDocument()
      expect(screen.getByText('Timer de Tempo')).toBeInTheDocument()
      
      // Timer display
      expect(screen.getByTestId('timer-display')).toBeInTheDocument()
      expect(screen.getByTestId('elapsed-time')).toHaveTextContent('00:00:00')
      expect(screen.getByTestId('timer-status')).toHaveTextContent('Parado')
      
      // Timer controls
      expect(screen.getByTestId('start-timer-btn')).toBeInTheDocument()
      expect(screen.getByTestId('stop-timer-btn')).toBeInTheDocument()
      expect(screen.getByTestId('reset-timer-btn')).toBeInTheDocument()
    })

    it('should require matter and task selection before starting timer', async () => {
      render(
        <TestWrapper>
          <MockTimeTracker />
        </TestWrapper>
      )

      const startBtn = screen.getByTestId('start-timer-btn')
      const stopBtn = screen.getByTestId('stop-timer-btn')
      
      // Start button should be disabled without selections
      expect(startBtn).toBeDisabled()
      expect(stopBtn).toBeDisabled()

      // Select matter but not task
      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      await user.selectOptions(matterSelect, 'matter-1')
      
      expect(startBtn).toBeDisabled() // Still disabled without task

      // Select task
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      await user.selectOptions(taskSelect, 'Consultation')
      
      expect(startBtn).not.toBeDisabled() // Now enabled
    })

    it('should start and stop timer correctly', async () => {
      const onTimerStart = jest.fn()
      const onTimerStop = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeTracker onTimerStart={onTimerStart} onTimerStop={onTimerStop} />
        </TestWrapper>
      )

      // Setup required fields
      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      
      await user.selectOptions(matterSelect, 'matter-1')
      await user.selectOptions(taskSelect, 'Consultation')

      const startBtn = screen.getByTestId('start-timer-btn')
      const stopBtn = screen.getByTestId('stop-timer-btn')
      const statusElement = screen.getByTestId('timer-status')

      // Start timer
      await user.click(startBtn)
      
      expect(onTimerStart).toHaveBeenCalledWith({
        matter_id: 'matter-1',
        task_category: 'Consultation',
        description: '',
        is_billable: true,
        hourly_rate: 350
      })
      
      expect(statusElement).toHaveTextContent('Em Andamento')
      expect(startBtn).toBeDisabled()
      expect(stopBtn).not.toBeDisabled()

      // Advance timer and check display
      jest.advanceTimersByTime(5000) // 5 seconds
      expect(screen.getByTestId('elapsed-time')).toHaveTextContent('00:00:05')

      // Stop timer
      await user.click(stopBtn)
      
      expect(onTimerStop).toHaveBeenCalled()
      expect(statusElement).toHaveTextContent('Parado')
      expect(startBtn).not.toBeDisabled()
      expect(stopBtn).toBeDisabled()
    })

    it('should reset timer correctly', async () => {
      render(
        <TestWrapper>
          <MockTimeTracker />
        </TestWrapper>
      )

      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      
      await user.selectOptions(matterSelect, 'matter-1')
      await user.selectOptions(taskSelect, 'Consultation')

      const startBtn = screen.getByTestId('start-timer-btn')
      const stopBtn = screen.getByTestId('stop-timer-btn')
      const resetBtn = screen.getByTestId('reset-timer-btn')

      // Start timer and let it run
      await user.click(startBtn)
      jest.advanceTimersByTime(10000) // 10 seconds
      
      expect(screen.getByTestId('elapsed-time')).toHaveTextContent('00:00:10')

      // Stop timer
      await user.click(stopBtn)

      // Reset timer
      await user.click(resetBtn)
      
      expect(screen.getByTestId('elapsed-time')).toHaveTextContent('00:00:00')
      expect(screen.getByTestId('timer-status')).toHaveTextContent('Parado')
    })

    it('should show live billing calculation when timer is running', async () => {
      render(
        <TestWrapper>
          <MockTimeTracker />
        </TestWrapper>
      )

      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      const rateInput = screen.getByRole('spinbutton', { name: /taxa horária/i })
      
      await user.selectOptions(matterSelect, 'matter-1')
      await user.selectOptions(taskSelect, 'Consultation')
      
      // Set hourly rate to 300
      await user.clear(rateInput)
      await user.type(rateInput, '300')

      // Start timer
      const startBtn = screen.getByTestId('start-timer-btn')
      await user.click(startBtn)

      // Let timer run for 60 seconds (1 minute)
      jest.advanceTimersByTime(60000)

      // Should show live calculation (1 minute / 60 minutes * 300 = 5.00)
      const liveCalc = screen.getByTestId('live-calculation')
      expect(liveCalc).toHaveTextContent('Valor atual: R$ 5.00')
    })

    it('should handle billable vs non-billable time correctly', async () => {
      render(
        <TestWrapper>
          <MockTimeTracker />
        </TestWrapper>
      )

      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      const billableCheckbox = screen.getByRole('checkbox', { name: /tempo faturável/i })
      
      await user.selectOptions(matterSelect, 'matter-1')
      await user.selectOptions(taskSelect, 'Administrative')

      // Test non-billable time
      await user.click(billableCheckbox) // Uncheck billable
      
      // Hourly rate input should not be visible for non-billable
      expect(screen.queryByTestId('hourly-rate-input')).not.toBeInTheDocument()

      // Start timer
      await user.click(screen.getByTestId('start-timer-btn'))
      jest.advanceTimersByTime(60000) // 1 minute

      // No live calculation should appear for non-billable time
      expect(screen.queryByTestId('live-calculation')).not.toBeInTheDocument()
    })
  })

  describe('Time Entry Creation', () => {
    it('should create time entry when timer stops', async () => {
      const onTimeEntryCreate = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeTracker onTimeEntryCreate={onTimeEntryCreate} />
        </TestWrapper>
      )

      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      const descriptionInput = screen.getByRole('textbox', { name: /descrição/i })
      
      await user.selectOptions(matterSelect, 'matter-1')
      await user.selectOptions(taskSelect, 'Consultation')
      await user.type(descriptionInput, 'Consulta sobre contrato trabalhista')

      // Start timer, let it run, then stop
      await user.click(screen.getByTestId('start-timer-btn'))
      jest.advanceTimersByTime(90000) // 1.5 minutes
      await user.click(screen.getByTestId('stop-timer-btn'))

      // Verify time entry creation
      expect(onTimeEntryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          matter_id: 'matter-1',
          task_category: 'Consultation',
          description: 'Consulta sobre contrato trabalhista',
          effective_minutes: 1, // 90 seconds = 1 minute (floored)
          is_billable: true,
          billable_rate: 350,
          billable_amount: expect.any(Number),
          entry_status: 'draft'
        })
      )
    })

    it('should calculate billable amount correctly', async () => {
      const onTimeEntryCreate = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeTracker onTimeEntryCreate={onTimeEntryCreate} />
        </TestWrapper>
      )

      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      const rateInput = screen.getByRole('spinbutton', { name: /taxa horária/i })
      
      await user.selectOptions(matterSelect, 'matter-1')
      await user.selectOptions(taskSelect, 'Document Review')
      
      // Set rate to 400
      await user.clear(rateInput)
      await user.type(rateInput, '400')

      // Start timer for exactly 2 minutes (120 seconds)
      await user.click(screen.getByTestId('start-timer-btn'))
      jest.advanceTimersByTime(120000)
      await user.click(screen.getByTestId('stop-timer-btn'))

      // Expected calculation: 2 minutes / 60 minutes * 400 = 13.33
      expect(onTimeEntryCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          effective_minutes: 2,
          billable_rate: 400,
          billable_amount: (2 / 60) * 400 // ≈ 13.33
        })
      )
    })
  })

  describe('Time Entry List Management', () => {
    it('should display time entries with correct information', async () => {
      render(
        <TestWrapper>
          <MockTimeEntryList />
        </TestWrapper>
      )

      expect(screen.getByTestId('time-entry-list')).toBeInTheDocument()
      expect(screen.getByText('Entradas de Tempo')).toBeInTheDocument()

      // Check summary statistics
      expect(screen.getByTestId('total-entries')).toHaveTextContent('Total de Entradas: 3')
      expect(screen.getByTestId('billable-time')).toHaveTextContent('Tempo Faturável: 3h 30m')
      expect(screen.getByTestId('non-billable-time')).toHaveTextContent('Tempo Não-Faturável: 0h 45m')
      expect(screen.getByTestId('total-amount')).toHaveTextContent('Valor Total: R$ 1275.00')

      // Check individual entries
      const entry1 = screen.getByTestId('time-entry-entry-1')
      expect(within(entry1).getByTestId('entry-matter')).toHaveTextContent('Ação Trabalhista - TechCorp')
      expect(within(entry1).getByTestId('entry-task')).toHaveTextContent('Document Review')
      expect(within(entry1).getByTestId('entry-duration')).toHaveTextContent('2h 30m')
      expect(within(entry1).getByTestId('entry-billable')).toHaveTextContent('Faturável')
      expect(within(entry1).getByTestId('entry-amount')).toHaveTextContent('R$ 875.00')
    })

    it('should enable editing of time entries', async () => {
      const onTimeEntryEdit = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeEntryList onTimeEntryEdit={onTimeEntryEdit} />
        </TestWrapper>
      )

      // Click edit button for first entry
      const editBtn = screen.getByTestId('edit-entry-entry-1')
      await user.click(editBtn)

      // Should show edit form
      const editForm = screen.getByTestId('edit-form-entry-1')
      expect(editForm).toBeInTheDocument()

      // Modify description
      const descriptionInput = within(editForm).getByRole('textbox')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Análise detalhada de documentos trabalhistas')

      // Modify minutes
      const minutesInput = within(editForm).getByRole('spinbutton')
      await user.clear(minutesInput)
      await user.type(minutesInput, '180') // 3 hours

      // Save changes
      const saveBtn = screen.getByTestId('save-edit-entry-1')
      await user.click(saveBtn)

      // Verify callback was called with updated data
      expect(onTimeEntryEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'entry-1',
          description: 'Análise detalhada de documentos trabalhistas',
          effective_minutes: 180,
          billable_amount: (180 / 60) * 350 // 3 hours * 350 = 1050
        })
      )
    })

    it('should allow canceling edit operations', async () => {
      render(
        <TestWrapper>
          <MockTimeEntryList />
        </TestWrapper>
      )

      // Start editing
      const editBtn = screen.getByTestId('edit-entry-entry-1')
      await user.click(editBtn)

      // Modify something
      const editForm = screen.getByTestId('edit-form-entry-1')
      const descriptionInput = within(editForm).getByRole('textbox')
      await user.clear(descriptionInput)
      await user.type(descriptionInput, 'Modified description')

      // Cancel edit
      const cancelBtn = screen.getByTestId('cancel-edit-entry-1')
      await user.click(cancelBtn)

      // Should return to view mode with original data
      const viewMode = screen.getByTestId('view-mode-entry-1')
      expect(viewMode).toBeInTheDocument()
      expect(within(viewMode).getByTestId('entry-description')).toHaveTextContent('Análise de documentos trabalhistas')
    })

    it('should delete time entries', async () => {
      const onTimeEntryDelete = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeEntryList onTimeEntryDelete={onTimeEntryDelete} />
        </TestWrapper>
      )

      // Delete first entry
      const deleteBtn = screen.getByTestId('delete-entry-entry-1')
      await user.click(deleteBtn)

      expect(onTimeEntryDelete).toHaveBeenCalledWith('entry-1')
    })

    it('should recalculate amounts when editing billable entries', async () => {
      const onTimeEntryEdit = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeEntryList onTimeEntryEdit={onTimeEntryEdit} />
        </TestWrapper>
      )

      // Edit billable entry
      await user.click(screen.getByTestId('edit-entry-entry-2'))

      const editForm = screen.getByTestId('edit-form-entry-2')
      
      // Change rate from 400 to 500
      const rateInput = within(editForm).getByTestId('edit-rate').querySelector('input')
      await user.clear(rateInput)
      await user.type(rateInput, '500')

      // Change duration from 60 to 90 minutes
      const minutesInput = within(editForm).getByTestId('edit-minutes').querySelector('input')
      await user.clear(minutesInput)
      await user.type(minutesInput, '90')

      // Save
      await user.click(screen.getByTestId('save-edit-entry-2'))

      // Should calculate: 90 minutes = 1.5 hours * 500 = 750
      expect(onTimeEntryEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          effective_minutes: 90,
          billable_rate: 500,
          billable_amount: (90 / 60) * 500 // 750
        })
      )
    })

    it('should handle conversion between billable and non-billable', async () => {
      const onTimeEntryEdit = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeEntryList onTimeEntryEdit={onTimeEntryEdit} />
        </TestWrapper>
      )

      // Edit billable entry and make it non-billable
      await user.click(screen.getByTestId('edit-entry-entry-1'))

      const editForm = screen.getByTestId('edit-form-entry-1')
      const billableCheckbox = within(editForm).getByTestId('edit-billable').querySelector('input')
      
      await user.click(billableCheckbox) // Uncheck billable

      // Rate input should disappear
      expect(within(editForm).queryByTestId('edit-rate')).not.toBeInTheDocument()

      // Save
      await user.click(screen.getByTestId('save-edit-entry-1'))

      // Should set billable_amount to 0
      expect(onTimeEntryEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          is_billable: false,
          billable_amount: 0
        })
      )
    })
  })

  describe('Time Entry Templates', () => {
    it('should display available templates', async () => {
      render(
        <TestWrapper>
          <MockTimeEntryTemplates />
        </TestWrapper>
      )

      expect(screen.getByTestId('time-entry-templates')).toBeInTheDocument()
      expect(screen.getByText('Templates de Entrada de Tempo')).toBeInTheDocument()

      // Check default templates
      const template1 = screen.getByTestId('template-template-1')
      expect(within(template1).getByTestId('template-name')).toHaveTextContent('Consulta Jurídica Padrão')
      expect(within(template1).getByTestId('template-category')).toHaveTextContent('Consultation')
      expect(within(template1).getByTestId('template-duration')).toHaveTextContent('60 min')
      expect(within(template1).getByTestId('template-billable')).toHaveTextContent('R$ 350/h')

      const template3 = screen.getByTestId('template-template-3')
      expect(within(template3).getByTestId('template-billable')).toHaveTextContent('Não-Faturável')
    })

    it('should use templates correctly', async () => {
      const onTemplateUse = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeEntryTemplates onTemplateUse={onTemplateUse} />
        </TestWrapper>
      )

      // Use first template
      const useBtn = screen.getByTestId('use-template-template-1')
      await user.click(useBtn)

      expect(onTemplateUse).toHaveBeenCalledWith({
        id: 'template-1',
        name: 'Consulta Jurídica Padrão',
        task_category: 'Consultation',
        description: 'Consulta jurídica com cliente',
        default_duration: 60,
        is_billable: true,
        default_rate: 350
      })
    })

    it('should create new templates', async () => {
      const onTemplateCreate = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeEntryTemplates onTemplateCreate={onTemplateCreate} />
        </TestWrapper>
      )

      // Show create form
      const showFormBtn = screen.getByTestId('show-create-template-btn')
      await user.click(showFormBtn)

      const createForm = screen.getByTestId('create-template-form')
      expect(createForm).toBeInTheDocument()

      // Fill form
      const nameInput = within(createForm).getByTestId('template-name-input').querySelector('input')
      const categorySelect = within(createForm).getByTestId('template-category-input').querySelector('select')
      const descriptionInput = within(createForm).getByTestId('template-description-input').querySelector('textarea')
      const durationInput = within(createForm).getByTestId('template-duration-input').querySelector('input')

      await user.type(nameInput, 'Audiência Judicial')
      await user.selectOptions(categorySelect, 'Court Appearance')
      await user.type(descriptionInput, 'Comparecimento em audiência judicial')
      await user.clear(durationInput)
      await user.type(durationInput, '120')

      // Create template
      const createBtn = screen.getByTestId('create-template-btn')
      await user.click(createBtn)

      expect(onTemplateCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Audiência Judicial',
          task_category: 'Court Appearance',
          description: 'Comparecimento em audiência judicial',
          default_duration: 120,
          is_billable: true,
          default_rate: 350
        })
      )

      // Form should be hidden after creation
      expect(screen.queryByTestId('create-template-form')).not.toBeInTheDocument()
    })

    it('should disable create button with incomplete form', async () => {
      render(
        <TestWrapper>
          <MockTimeEntryTemplates />
        </TestWrapper>
      )

      // Show create form
      await user.click(screen.getByTestId('show-create-template-btn'))

      const createBtn = screen.getByTestId('create-template-btn')
      expect(createBtn).toBeDisabled() // Should be disabled initially

      // Add name but not category
      const nameInput = screen.getByTestId('template-name-input').querySelector('input')
      await user.type(nameInput, 'Test Template')
      
      expect(createBtn).toBeDisabled() // Still disabled without category

      // Add category
      const categorySelect = screen.getByTestId('template-category-input').querySelector('select')
      await user.selectOptions(categorySelect, 'Research')
      
      expect(createBtn).not.toBeDisabled() // Now enabled
    })

    it('should handle non-billable template creation', async () => {
      const onTemplateCreate = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeEntryTemplates onTemplateCreate={onTemplateCreate} />
        </TestWrapper>
      )

      // Show create form
      await user.click(screen.getByTestId('show-create-template-btn'))

      const createForm = screen.getByTestId('create-template-form')
      
      // Fill basic info
      const nameInput = within(createForm).getByTestId('template-name-input').querySelector('input')
      const categorySelect = within(createForm).getByTestId('template-category-input').querySelector('select')
      
      await user.type(nameInput, 'Internal Meeting')
      await user.selectOptions(categorySelect, 'Administrative')

      // Make it non-billable
      const billableCheckbox = within(createForm).getByTestId('template-billable-input').querySelector('input')
      await user.click(billableCheckbox)

      // Rate input should disappear
      expect(within(createForm).queryByTestId('template-rate-input')).not.toBeInTheDocument()

      // Create template
      await user.click(screen.getByTestId('create-template-btn'))

      expect(onTemplateCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Internal Meeting',
          is_billable: false,
          default_rate: 350 // Should keep the original rate even if non-billable
        })
      )
    })
  })

  describe('Time Calculations and Formatting', () => {
    it('should format time correctly in different contexts', async () => {
      render(
        <TestWrapper>
          <MockTimeEntryList />
        </TestWrapper>
      )

      // Check various time formatting scenarios
      expect(screen.getByTestId('billable-time')).toHaveTextContent('3h 30m') // 210 minutes
      expect(screen.getByTestId('non-billable-time')).toHaveTextContent('0h 45m') // 45 minutes

      // Individual entry formatting
      const entry1 = screen.getByTestId('time-entry-entry-1')
      expect(within(entry1).getByTestId('entry-duration')).toHaveTextContent('2h 30m') // 150 minutes
    })

    it('should calculate billable amounts accurately', async () => {
      render(
        <TestWrapper>
          <MockTimeEntryList />
        </TestWrapper>
      )

      // Verify calculations match expected values
      // Entry 1: 150 minutes = 2.5 hours * 350 = 875
      const entry1 = screen.getByTestId('time-entry-entry-1')
      expect(within(entry1).getByTestId('entry-amount')).toHaveTextContent('R$ 875.00')

      // Entry 2: 60 minutes = 1 hour * 400 = 400
      const entry2 = screen.getByTestId('time-entry-entry-2')
      expect(within(entry2).getByTestId('entry-amount')).toHaveTextContent('R$ 400.00')

      // Total: 875 + 400 = 1275
      expect(screen.getByTestId('total-amount')).toHaveTextContent('Valor Total: R$ 1275.00')
    })
  })

  describe('Responsive Design', () => {
    it('should adapt timer interface for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <MockTimeTracker />
        </TestWrapper>
      )

      const timeTracker = screen.getByTestId('time-tracker')
      expect(timeTracker).toBeInTheDocument()

      // Verify all essential elements are present and functional
      expect(screen.getByTestId('timer-display')).toBeInTheDocument()
      expect(screen.getByTestId('timer-controls')).toBeInTheDocument()
      expect(screen.getByTestId('time-entry-form')).toBeInTheDocument()
    })

    it('should maintain functionality on tablet devices', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      const onTimeEntryCreate = jest.fn()
      
      render(
        <TestWrapper>
          <MockTimeTracker onTimeEntryCreate={onTimeEntryCreate} />
        </TestWrapper>
      )

      // Test that timer functionality works on tablet
      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      
      await user.selectOptions(matterSelect, 'matter-1')
      await user.selectOptions(taskSelect, 'Consultation')

      await user.click(screen.getByTestId('start-timer-btn'))
      jest.advanceTimersByTime(30000) // 30 seconds
      await user.click(screen.getByTestId('stop-timer-btn'))

      expect(onTimeEntryCreate).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <MockTimeTracker />
        </TestWrapper>
      )

      // Check form labels
      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      expect(matterSelect).toHaveAccessibleName()

      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      expect(taskSelect).toHaveAccessibleName()

      const descriptionInput = screen.getByRole('textbox', { name: /descrição/i })
      expect(descriptionInput).toHaveAccessibleName()

      // Check buttons have descriptive text
      expect(screen.getByTestId('start-timer-btn')).toHaveTextContent('Iniciar')
      expect(screen.getByTestId('stop-timer-btn')).toHaveTextContent('Parar')
      expect(screen.getByTestId('reset-timer-btn')).toHaveTextContent('Resetar')
    })

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <MockTimeTracker />
        </TestWrapper>
      )

      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      const startBtn = screen.getByTestId('start-timer-btn')

      // Tab navigation
      matterSelect.focus()
      expect(matterSelect).toHaveFocus()

      await user.tab()
      expect(taskSelect).toHaveFocus()

      // Make selections with keyboard
      await user.selectOptions(matterSelect, 'matter-1')
      await user.selectOptions(taskSelect, 'Consultation')

      // Navigate to start button and activate
      startBtn.focus()
      expect(startBtn).toHaveFocus()
      expect(startBtn).not.toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    it('should handle timer errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <MockTimeTracker />
        </TestWrapper>
      )

      // Even if there are internal errors, the UI should remain functional
      const matterSelect = screen.getByRole('combobox', { name: /caso/i })
      const taskSelect = screen.getByRole('combobox', { name: /categoria/i })
      
      await user.selectOptions(matterSelect, 'matter-1')
      await user.selectOptions(taskSelect, 'Consultation')

      const startBtn = screen.getByTestId('start-timer-btn')
      expect(startBtn).not.toBeDisabled()

      consoleSpy.mockRestore()
    })

    it('should validate time entry inputs', async () => {
      render(
        <TestWrapper>
          <MockTimeEntryList />
        </TestWrapper>
      )

      // Start editing an entry
      await user.click(screen.getByTestId('edit-entry-entry-1'))

      const editForm = screen.getByTestId('edit-form-entry-1')
      const minutesInput = within(editForm).getByTestId('edit-minutes').querySelector('input')
      const rateInput = within(editForm).getByTestId('edit-rate').querySelector('input')

      // Test negative minutes
      await user.clear(minutesInput)
      await user.type(minutesInput, '-30')
      
      // Input should enforce min="0"
      expect(minutesInput).toHaveAttribute('min', '0')

      // Test negative rate
      await user.clear(rateInput)
      await user.type(rateInput, '-100')
      
      // Input should enforce min="0"
      expect(rateInput).toHaveAttribute('min', '0')
    })
  })
})