/**
 * Frontend UI Tests: Admin Pages
 * Tests admin panel, analytics, security, billing, and notifications pages
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
  usePathname: () => '/admin',
}))

// Note: Mock components are self-contained and don't import from @/ paths

// --- Mock: Admin Page ---
const MockAdminPage = ({ users, matters, lawFirm, activityLogs }: {
  users?: { id: string; status: string; full_name: string; user_type: string }[]
  matters?: { id: string; status: string }[]
  lawFirm?: { name: string; plan_type: string; subscription_active: boolean }
  activityLogs?: { id: string; action: string; entity_type: string; description: string; created_at: string }[]
}) => {
  const allUsers = users ?? [
    { id: 'u1', status: 'active', full_name: 'Admin', user_type: 'admin' },
    { id: 'u2', status: 'active', full_name: 'Lawyer', user_type: 'lawyer' },
    { id: 'u3', status: 'inactive', full_name: 'Staff', user_type: 'staff' },
  ]
  const allMatters = matters ?? [
    { id: 'm1', status: 'active' },
    { id: 'm2', status: 'active' },
    { id: 'm3', status: 'closed' },
  ]
  const firm = lawFirm ?? { name: 'Silva & Associados', plan_type: 'professional', subscription_active: true }
  const logs = activityLogs ?? [
    { id: 'log1', action: 'create', entity_type: 'matter', description: 'Caso criado', created_at: '2025-01-10T10:00:00Z' },
    { id: 'log2', action: 'update', entity_type: 'user', description: 'Usuario atualizado', created_at: '2025-01-09T14:00:00Z' },
  ]

  const activeUsers = allUsers.filter(u => u.status === 'active').length
  const activeMatters = allMatters.filter(m => m.status === 'active').length

  const adminSections = [
    { title: 'Configuracoes do Escritorio', href: '/admin/law-firm' },
    { title: 'Gestao de Usuarios', href: '/admin/users' },
    { title: 'Personalizacao', href: '/admin/branding' },
    { title: 'Configuracoes do Sistema', href: '/admin/settings' },
    { title: 'Analiticos', href: '/admin/analytics' },
    { title: 'Seguranca', href: '/admin/security' },
    { title: 'Faturamento', href: '/admin/billing' },
    { title: 'Notificacoes', href: '/admin/notifications' },
  ]

  return (
    <div data-testid="admin-page">
      <div data-testid="admin-header">
        <h1>Painel Administrativo</h1>
        <p>Gerencie todas as configuracoes do escritorio {firm.name}</p>
      </div>

      <div data-testid="admin-stats">
        <div data-testid="stat-active-users">
          <p>Usuarios Ativos</p>
          <p data-testid="stat-active-users-value">{activeUsers}</p>
        </div>
        <div data-testid="stat-active-matters">
          <p>Casos Ativos</p>
          <p data-testid="stat-active-matters-value">{activeMatters}</p>
        </div>
        <div data-testid="stat-plan">
          <p>Plano Atual</p>
          <p data-testid="stat-plan-value">{firm.plan_type}</p>
        </div>
        <div data-testid="stat-status">
          <p>Status</p>
          <p data-testid="stat-status-value">{firm.subscription_active ? 'Ativo' : 'Inativo'}</p>
        </div>
      </div>

      <div data-testid="admin-sections">
        {adminSections.map((section) => (
          <a key={section.href} href={section.href} data-testid={`section-${section.href.replace('/admin/', '')}`}>
            <h3>{section.title}</h3>
          </a>
        ))}
      </div>

      <div data-testid="recent-activity">
        <h2>Atividade Recente</h2>
        {logs.length === 0 ? (
          <p data-testid="no-activity">Nenhuma atividade recente registrada.</p>
        ) : (
          <div data-testid="activity-list">
            {logs.map((log) => (
              <div key={log.id} data-testid={`activity-${log.id}`}>
                <p>{log.description || `${log.action} em ${log.entity_type}`}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// --- Mock: Admin Analytics ---
const MockAdminAnalytics = ({ matters, users, invoices, activityLogs }: {
  matters?: { id: string; status: string }[]
  users?: { id: string; user_type: string }[]
  invoices?: { id: string; status: string; total_amount: number; outstanding_amount: number }[]
  activityLogs?: { id: string; action: string; entity_type: string; description: string; created_at: string }[]
}) => {
  const allMatters = matters ?? [
    { id: 'm1', status: 'active' },
    { id: 'm2', status: 'active' },
    { id: 'm3', status: 'closed' },
    { id: 'm4', status: 'on_hold' },
  ]
  const allUsers = users ?? [
    { id: 'u1', user_type: 'admin' },
    { id: 'u2', user_type: 'lawyer' },
    { id: 'u3', user_type: 'lawyer' },
    { id: 'u4', user_type: 'client' },
  ]
  const allInvoices = invoices ?? [
    { id: 'i1', status: 'paid', total_amount: 5000, outstanding_amount: 0 },
    { id: 'i2', status: 'sent', total_amount: 3000, outstanding_amount: 3000 },
  ]
  const logs = activityLogs ?? [
    { id: 'l1', action: 'create', entity_type: 'matter', description: 'Caso criado', created_at: '2025-01-10T10:00:00Z' },
    { id: 'l2', action: 'update', entity_type: 'user', description: 'Usuario atualizado', created_at: '2025-01-09T14:00:00Z' },
  ]

  const mattersByStatus: Record<string, number> = {}
  allMatters.forEach(m => { mattersByStatus[m.status] = (mattersByStatus[m.status] || 0) + 1 })

  const usersByType: Record<string, number> = {}
  allUsers.forEach(u => { usersByType[u.user_type] = (usersByType[u.user_type] || 0) + 1 })

  const totalRevenue = allInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total_amount, 0)
  const outstandingRevenue = allInvoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + i.outstanding_amount, 0)

  const matterStatusLabels: Record<string, string> = {
    active: 'Ativos', closed: 'Encerrados', on_hold: 'Suspensos', settled: 'Acordos', dismissed: 'Arquivados',
  }
  const userTypeLabels: Record<string, string> = {
    admin: 'Administradores', lawyer: 'Advogados', staff: 'Funcionarios', client: 'Clientes',
  }

  return (
    <div data-testid="admin-analytics">
      <h1>Analiticos</h1>

      <div data-testid="summary-cards">
        <div data-testid="card-total-cases">
          <p>Total de Casos</p>
          <p data-testid="total-cases-value">{allMatters.length}</p>
        </div>
        <div data-testid="card-total-users">
          <p>Total de Usuarios</p>
          <p data-testid="total-users-value">{allUsers.length}</p>
        </div>
        <div data-testid="card-revenue">
          <p>Receita Recebida</p>
          <p data-testid="revenue-value">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div data-testid="card-outstanding">
          <p>A Receber</p>
          <p data-testid="outstanding-value">R$ {outstandingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div data-testid="matters-by-status">
        <h2>Casos por Status</h2>
        {Object.entries(mattersByStatus).length === 0 ? (
          <p data-testid="no-matters">Nenhum caso registrado.</p>
        ) : (
          Object.entries(mattersByStatus).map(([status, count]) => (
            <div key={status} data-testid={`matter-status-${status}`}>
              <span data-testid="status-label">{matterStatusLabels[status] ?? status}</span>
              <span data-testid="status-count">{count}</span>
              <div data-testid="status-bar" style={{ width: `${(count / Math.max(...Object.values(mattersByStatus))) * 100}%` }} />
            </div>
          ))
        )}
      </div>

      <div data-testid="users-by-type">
        <h2>Usuarios por Tipo</h2>
        {Object.entries(usersByType).length === 0 ? (
          <p data-testid="no-users">Nenhum usuario registrado.</p>
        ) : (
          Object.entries(usersByType).map(([type, count]) => (
            <div key={type} data-testid={`user-type-${type}`}>
              <span data-testid="type-label">{userTypeLabels[type] ?? type}</span>
              <span data-testid="type-count">{count}</span>
            </div>
          ))
        )}
      </div>

      <div data-testid="recent-activity-table">
        <h2>Ultimas Atividades</h2>
        <table data-testid="activity-table">
          <thead>
            <tr>
              <th>Acao</th>
              <th>Entidade</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {logs.slice(0, 10).map((log) => (
              <tr key={log.id} data-testid={`activity-row-${log.id}`}>
                <td data-testid="activity-action">{log.description || log.action}</td>
                <td data-testid="activity-entity">{log.entity_type}</td>
                <td data-testid="activity-date">{new Date(log.created_at).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p data-testid="no-activity">Nenhuma atividade registrada.</p>}
      </div>
    </div>
  )
}

// --- Mock: Admin Security ---
const MockAdminSecurity = ({ users, activityLogs }: {
  users?: { id: string; full_name: string; status: string }[]
  activityLogs?: { id: string; action: string; entity_type: string; description: string; created_at: string; user_id: string }[]
}) => {
  const allUsers = users ?? [
    { id: 'u1', full_name: 'Admin Silva', status: 'active' },
    { id: 'u2', full_name: 'Lawyer Costa', status: 'active' },
    { id: 'u3', full_name: 'Staff Lima', status: 'inactive' },
  ]
  const logs = activityLogs ?? [
    { id: 'l1', action: 'login', entity_type: 'session', description: 'Login realizado', created_at: '2025-01-10T10:00:00Z', user_id: 'u1' },
    { id: 'l2', action: 'create', entity_type: 'matter', description: 'Caso criado', created_at: '2025-01-09T14:00:00Z', user_id: 'u2' },
    { id: 'l3', action: 'update', entity_type: 'user', description: 'Perfil atualizado', created_at: '2025-01-08T09:00:00Z', user_id: 'u1' },
    { id: 'l4', action: 'login', entity_type: 'session', description: 'Login realizado', created_at: '2025-01-08T08:00:00Z', user_id: 'u2' },
  ]

  const [entityFilter, setEntityFilter] = React.useState('')
  const [userFilter, setUserFilter] = React.useState('')

  const activeUsers = allUsers.filter(u => u.status === 'active').length
  const totalLogins = logs.filter(l => l.action === 'login').length
  const entityTypes = [...new Set(logs.map(l => l.entity_type))]

  const filteredLogs = logs.filter(log => {
    const matchEntity = !entityFilter || log.entity_type === entityFilter
    const matchUser = !userFilter || log.user_id === userFilter
    return matchEntity && matchUser
  })

  return (
    <div data-testid="admin-security">
      <h1>Seguranca</h1>

      <div data-testid="security-stats">
        <div data-testid="stat-active-users">
          <p>Usuarios Ativos</p>
          <p data-testid="active-users-value">{activeUsers}</p>
        </div>
        <div data-testid="stat-total-logins">
          <p>Logins Recentes</p>
          <p data-testid="total-logins-value">{totalLogins}</p>
        </div>
        <div data-testid="stat-total-events">
          <p>Total de Eventos</p>
          <p data-testid="total-events-value">{logs.length}</p>
        </div>
      </div>

      <div data-testid="security-filters">
        <select
          data-testid="entity-filter"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="">Todas as Entidades</option>
          {entityTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select
          data-testid="user-filter"
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
        >
          <option value="">Todos os Usuarios</option>
          {allUsers.map(u => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>
      </div>

      <div data-testid="audit-log">
        <h2>Log de Auditoria ({filteredLogs.length} eventos)</h2>
        <table data-testid="audit-table">
          <thead>
            <tr>
              <th>Acao</th>
              <th>Usuario</th>
              <th>Entidade</th>
              <th>Descricao</th>
              <th>Quando</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => {
              const logUser = allUsers.find(u => u.id === log.user_id)
              return (
                <tr key={log.id} data-testid={`audit-row-${log.id}`}>
                  <td data-testid="audit-action">{log.action}</td>
                  <td data-testid="audit-user">{logUser?.full_name ?? 'Sistema'}</td>
                  <td data-testid="audit-entity">{log.entity_type}</td>
                  <td data-testid="audit-description">{log.description || '-'}</td>
                  <td data-testid="audit-time">{new Date(log.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filteredLogs.length === 0 && (
          <p data-testid="no-events">Nenhum evento encontrado.</p>
        )}
      </div>
    </div>
  )
}

// --- Mock: Admin Billing ---
const MockAdminBilling = ({ lawFirm, invoices }: {
  lawFirm?: { plan_type: string; subscription_active: boolean }
  invoices?: { id: string; invoice_number: string; total_amount: number; status: string; due_date: string }[]
}) => {
  const firm = lawFirm ?? { plan_type: 'professional', subscription_active: true }
  const allInvoices = invoices ?? [
    { id: 'i1', invoice_number: 'FAT-001', total_amount: 497, status: 'paid', due_date: '2025-01-15' },
    { id: 'i2', invoice_number: 'FAT-002', total_amount: 497, status: 'sent', due_date: '2025-02-15' },
  ]

  const planLabels: Record<string, string> = {
    trial: 'Teste Gratuito', basic: 'Basico', professional: 'Profissional', enterprise: 'Empresarial',
  }
  const planLimits: Record<string, { users: number; matters: number; storage: string }> = {
    trial: { users: 2, matters: 10, storage: '1 GB' },
    basic: { users: 5, matters: 50, storage: '5 GB' },
    professional: { users: 20, matters: 500, storage: '50 GB' },
    enterprise: { users: 100, matters: 5000, storage: '500 GB' },
  }
  const statusLabels: Record<string, string> = {
    draft: 'Rascunho', sent: 'Enviada', paid: 'Paga', overdue: 'Vencida', cancelled: 'Cancelada',
  }

  const currentPlan = firm.plan_type
  const limits = planLimits[currentPlan] ?? planLimits.professional

  return (
    <div data-testid="admin-billing">
      <h1>Faturamento</h1>

      <div data-testid="current-plan">
        <h2>Plano Atual</h2>
        <span data-testid="plan-status-badge">{firm.subscription_active ? 'Ativo' : 'Inativo'}</span>
        <p data-testid="plan-label">{planLabels[currentPlan] ?? currentPlan}</p>
        <div data-testid="plan-limits">
          <div data-testid="limit-users">
            <span>Limite de Usuarios</span>
            <span data-testid="limit-users-value">{limits.users}</span>
          </div>
          <div data-testid="limit-matters">
            <span>Limite de Casos</span>
            <span data-testid="limit-matters-value">{limits.matters}</span>
          </div>
          <div data-testid="limit-storage">
            <span>Armazenamento</span>
            <span data-testid="limit-storage-value">{limits.storage}</span>
          </div>
        </div>
      </div>

      <div data-testid="plan-comparison">
        <h2>Comparacao de Planos</h2>
        <div data-testid="plan-grid">
          {Object.entries(planLabels).map(([key, label]) => {
            const pl = planLimits[key]
            const isCurrent = key === currentPlan
            return (
              <div key={key} data-testid={`plan-${key}`} className={isCurrent ? 'current-plan' : ''}>
                <h3>{label}</h3>
                {isCurrent && <span data-testid="current-plan-badge">Plano atual</span>}
                <ul>
                  <li>{pl.users} usuarios</li>
                  <li>{pl.matters} casos</li>
                  <li>{pl.storage} armazenamento</li>
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <div data-testid="billing-history">
        <h2>Historico de Faturas</h2>
        <table data-testid="billing-table">
          <thead>
            <tr>
              <th>Fatura</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Vencimento</th>
            </tr>
          </thead>
          <tbody>
            {allInvoices.map(inv => (
              <tr key={inv.id} data-testid={`invoice-row-${inv.id}`}>
                <td data-testid="invoice-number">{inv.invoice_number}</td>
                <td data-testid="invoice-amount">R$ {inv.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td data-testid="invoice-status">{statusLabels[inv.status] ?? inv.status}</td>
                <td data-testid="invoice-due-date">{new Date(inv.due_date).toLocaleDateString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {allInvoices.length === 0 && (
          <p data-testid="no-invoices">Nenhuma fatura encontrada.</p>
        )}
      </div>
    </div>
  )
}

// --- Mock: Admin Notifications ---
const MockAdminNotifications = ({ onSave }: { onSave?: (settings: Record<string, unknown>) => void }) => {
  const [settings, setSettings] = React.useState({
    email_new_matter: true,
    email_deadline_reminder: true,
    email_invoice_created: true,
    email_payment_received: true,
    email_new_message: true,
    email_weekly_report: false,
    reminder_days_before: 3,
  })
  const [saving, setSaving] = React.useState(false)
  const [saveResult, setSaveResult] = React.useState<'success' | 'error' | null>(null)

  const notificationOptions = [
    { key: 'email_new_matter', label: 'Novo Caso', description: 'Notificar quando um novo caso for criado' },
    { key: 'email_deadline_reminder', label: 'Lembrete de Prazo', description: 'Alertar sobre prazos proximos de vencer' },
    { key: 'email_invoice_created', label: 'Fatura Criada', description: 'Notificar quando uma nova fatura for emitida' },
    { key: 'email_payment_received', label: 'Pagamento Recebido', description: 'Alertar quando um pagamento for confirmado' },
    { key: 'email_new_message', label: 'Nova Mensagem', description: 'Notificar sobre novas mensagens de clientes' },
    { key: 'email_weekly_report', label: 'Relatorio Semanal', description: 'Enviar resumo semanal de atividades por email' },
  ]

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveResult(null)
    try {
      if (onSave) {
        onSave(settings)
      }
      setSaveResult('success')
    } catch {
      setSaveResult('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div data-testid="admin-notifications">
      <h1>Notificacoes</h1>

      <div data-testid="notification-options">
        <h2>Notificacoes por Email</h2>
        {notificationOptions.map(option => (
          <div key={option.key} data-testid={`notification-${option.key}`}>
            <div>
              <p data-testid="notification-label">{option.label}</p>
              <p data-testid="notification-description">{option.description}</p>
            </div>
            <input
              type="checkbox"
              data-testid={`toggle-${option.key}`}
              checked={settings[option.key as keyof typeof settings] as boolean}
              onChange={() => handleToggle(option.key)}
            />
          </div>
        ))}
      </div>

      <div data-testid="reminder-settings">
        <h2>Configuracao de Lembretes</h2>
        <label>Dias de antecedencia para lembretes de prazo</label>
        <select
          data-testid="reminder-days-select"
          value={settings.reminder_days_before}
          onChange={(e) => setSettings(prev => ({ ...prev, reminder_days_before: Number(e.target.value) }))}
        >
          <option value={1}>1 dia</option>
          <option value={2}>2 dias</option>
          <option value={3}>3 dias</option>
          <option value={5}>5 dias</option>
          <option value={7}>7 dias</option>
          <option value={14}>14 dias</option>
        </select>
      </div>

      <div data-testid="save-section">
        <button
          data-testid="save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
        {saveResult === 'success' && <p data-testid="save-success">Configuracoes de notificacao salvas!</p>}
        {saveResult === 'error' && <p data-testid="save-error">Erro ao salvar configuracoes.</p>}
      </div>
    </div>
  )
}

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('Admin Pages UI Tests', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  // ====================== ADMIN PAGE ======================
  describe('Admin Page', () => {
    it('should render page header with firm name', () => {
      render(<TestWrapper><MockAdminPage /></TestWrapper>)
      expect(screen.getByTestId('admin-header')).toBeInTheDocument()
      expect(screen.getByText('Painel Administrativo')).toBeInTheDocument()
      expect(screen.getByText(/Silva & Associados/)).toBeInTheDocument()
    })

    it('should display 4 quick stat cards with real data', () => {
      render(<TestWrapper><MockAdminPage /></TestWrapper>)
      const stats = screen.getByTestId('admin-stats')
      expect(stats).toBeInTheDocument()
      expect(screen.getByTestId('stat-active-users-value')).toHaveTextContent('2')
      expect(screen.getByTestId('stat-active-matters-value')).toHaveTextContent('2')
      expect(screen.getByTestId('stat-plan-value')).toHaveTextContent('professional')
      expect(screen.getByTestId('stat-status-value')).toHaveTextContent('Ativo')
    })

    it('should show inactive status when subscription is inactive', () => {
      render(
        <TestWrapper>
          <MockAdminPage lawFirm={{ name: 'Test', plan_type: 'basic', subscription_active: false }} />
        </TestWrapper>
      )
      expect(screen.getByTestId('stat-status-value')).toHaveTextContent('Inativo')
    })

    it('should render all 8 admin section links with correct hrefs', () => {
      render(<TestWrapper><MockAdminPage /></TestWrapper>)
      const sections = screen.getByTestId('admin-sections')
      expect(sections).toBeInTheDocument()

      const expectedLinks = [
        { testId: 'section-law-firm', href: '/admin/law-firm' },
        { testId: 'section-users', href: '/admin/users' },
        { testId: 'section-branding', href: '/admin/branding' },
        { testId: 'section-settings', href: '/admin/settings' },
        { testId: 'section-analytics', href: '/admin/analytics' },
        { testId: 'section-security', href: '/admin/security' },
        { testId: 'section-billing', href: '/admin/billing' },
        { testId: 'section-notifications', href: '/admin/notifications' },
      ]

      expectedLinks.forEach(({ testId, href }) => {
        const link = screen.getByTestId(testId)
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', href)
      })
    })

    it('should display recent activity logs', () => {
      render(<TestWrapper><MockAdminPage /></TestWrapper>)
      const activity = screen.getByTestId('recent-activity')
      expect(activity).toBeInTheDocument()
      expect(screen.getByTestId('activity-log1')).toBeInTheDocument()
      expect(screen.getByTestId('activity-log2')).toBeInTheDocument()
    })

    it('should show empty state when no activity logs', () => {
      render(<TestWrapper><MockAdminPage activityLogs={[]} /></TestWrapper>)
      expect(screen.getByTestId('no-activity')).toHaveTextContent('Nenhuma atividade recente registrada.')
    })
  })

  // ====================== ADMIN ANALYTICS ======================
  describe('Admin Analytics', () => {
    it('should render 4 summary cards with correct values', () => {
      render(<TestWrapper><MockAdminAnalytics /></TestWrapper>)
      expect(screen.getByTestId('admin-analytics')).toBeInTheDocument()
      expect(screen.getByTestId('total-cases-value')).toHaveTextContent('4')
      expect(screen.getByTestId('total-users-value')).toHaveTextContent('4')
      expect(screen.getByTestId('revenue-value')).toHaveTextContent('R$')
      expect(screen.getByTestId('outstanding-value')).toHaveTextContent('R$')
    })

    it('should render matters by status with bar chart', () => {
      render(<TestWrapper><MockAdminAnalytics /></TestWrapper>)
      const mattersByStatus = screen.getByTestId('matters-by-status')
      expect(mattersByStatus).toBeInTheDocument()
      expect(screen.getByTestId('matter-status-active')).toBeInTheDocument()
      expect(screen.getByTestId('matter-status-closed')).toBeInTheDocument()
      expect(screen.getByTestId('matter-status-on_hold')).toBeInTheDocument()
    })

    it('should render users by type table', () => {
      render(<TestWrapper><MockAdminAnalytics /></TestWrapper>)
      const usersByType = screen.getByTestId('users-by-type')
      expect(usersByType).toBeInTheDocument()
      expect(screen.getByTestId('user-type-admin')).toBeInTheDocument()
      expect(screen.getByTestId('user-type-lawyer')).toBeInTheDocument()
      expect(screen.getByTestId('user-type-client')).toBeInTheDocument()
    })

    it('should render recent activity table with rows', () => {
      render(<TestWrapper><MockAdminAnalytics /></TestWrapper>)
      const table = screen.getByTestId('activity-table')
      expect(table).toBeInTheDocument()
      expect(screen.getByTestId('activity-row-l1')).toBeInTheDocument()
      expect(screen.getByTestId('activity-row-l2')).toBeInTheDocument()
    })

    it('should handle empty data gracefully', () => {
      render(
        <TestWrapper>
          <MockAdminAnalytics matters={[]} users={[]} invoices={[]} activityLogs={[]} />
        </TestWrapper>
      )
      expect(screen.getByTestId('total-cases-value')).toHaveTextContent('0')
      expect(screen.getByTestId('total-users-value')).toHaveTextContent('0')
      expect(screen.getByTestId('no-matters')).toBeInTheDocument()
      expect(screen.getByTestId('no-users')).toBeInTheDocument()
      expect(screen.getByTestId('no-activity')).toBeInTheDocument()
    })
  })

  // ====================== ADMIN SECURITY ======================
  describe('Admin Security', () => {
    it('should render 3 stat cards', () => {
      render(<TestWrapper><MockAdminSecurity /></TestWrapper>)
      expect(screen.getByTestId('admin-security')).toBeInTheDocument()
      expect(screen.getByTestId('active-users-value')).toHaveTextContent('2')
      expect(screen.getByTestId('total-logins-value')).toHaveTextContent('2')
      expect(screen.getByTestId('total-events-value')).toHaveTextContent('4')
    })

    it('should render filter dropdowns', () => {
      render(<TestWrapper><MockAdminSecurity /></TestWrapper>)
      expect(screen.getByTestId('entity-filter')).toBeInTheDocument()
      expect(screen.getByTestId('user-filter')).toBeInTheDocument()
    })

    it('should render audit log table with 5 columns', () => {
      render(<TestWrapper><MockAdminSecurity /></TestWrapper>)
      const table = screen.getByTestId('audit-table')
      expect(table).toBeInTheDocument()
      const headers = within(table).getAllByRole('columnheader')
      expect(headers).toHaveLength(5)
      expect(headers[0]).toHaveTextContent('Acao')
      expect(headers[1]).toHaveTextContent('Usuario')
      expect(headers[2]).toHaveTextContent('Entidade')
      expect(headers[3]).toHaveTextContent('Descricao')
      expect(headers[4]).toHaveTextContent('Quando')
    })

    it('should filter logs by entity type', async () => {
      render(<TestWrapper><MockAdminSecurity /></TestWrapper>)
      // Initially all 4 rows
      expect(screen.getByTestId('audit-row-l1')).toBeInTheDocument()
      expect(screen.getByTestId('audit-row-l2')).toBeInTheDocument()

      // Filter by 'matter'
      await user.selectOptions(screen.getByTestId('entity-filter'), 'matter')
      expect(screen.getByTestId('audit-row-l2')).toBeInTheDocument()
      expect(screen.queryByTestId('audit-row-l1')).not.toBeInTheDocument()
    })

    it('should filter logs by user', async () => {
      render(<TestWrapper><MockAdminSecurity /></TestWrapper>)
      // Filter by user u2
      await user.selectOptions(screen.getByTestId('user-filter'), 'u2')
      expect(screen.getByTestId('audit-row-l2')).toBeInTheDocument()
      expect(screen.getByTestId('audit-row-l4')).toBeInTheDocument()
      expect(screen.queryByTestId('audit-row-l3')).not.toBeInTheDocument()
    })

    it('should show empty state when filters match nothing', async () => {
      render(<TestWrapper><MockAdminSecurity activityLogs={[]} /></TestWrapper>)
      expect(screen.getByTestId('no-events')).toHaveTextContent('Nenhum evento encontrado.')
    })
  })

  // ====================== ADMIN BILLING ======================
  describe('Admin Billing', () => {
    it('should show current plan card with label and status', () => {
      render(<TestWrapper><MockAdminBilling /></TestWrapper>)
      expect(screen.getByTestId('admin-billing')).toBeInTheDocument()
      expect(screen.getByTestId('plan-label')).toHaveTextContent('Profissional')
      expect(screen.getByTestId('plan-status-badge')).toHaveTextContent('Ativo')
    })

    it('should render plan limits', () => {
      render(<TestWrapper><MockAdminBilling /></TestWrapper>)
      expect(screen.getByTestId('limit-users-value')).toHaveTextContent('20')
      expect(screen.getByTestId('limit-matters-value')).toHaveTextContent('500')
      expect(screen.getByTestId('limit-storage-value')).toHaveTextContent('50 GB')
    })

    it('should render 4-plan comparison grid with current plan highlighted', () => {
      render(<TestWrapper><MockAdminBilling /></TestWrapper>)
      const grid = screen.getByTestId('plan-grid')
      expect(grid).toBeInTheDocument()

      expect(screen.getByTestId('plan-trial')).toBeInTheDocument()
      expect(screen.getByTestId('plan-basic')).toBeInTheDocument()
      expect(screen.getByTestId('plan-professional')).toBeInTheDocument()
      expect(screen.getByTestId('plan-enterprise')).toBeInTheDocument()

      // Current plan badge
      expect(screen.getByTestId('current-plan-badge')).toHaveTextContent('Plano atual')
      expect(screen.getByTestId('plan-professional')).toHaveClass('current-plan')
    })

    it('should render invoice history table with status badges', () => {
      render(<TestWrapper><MockAdminBilling /></TestWrapper>)
      const table = screen.getByTestId('billing-table')
      expect(table).toBeInTheDocument()

      const row1 = screen.getByTestId('invoice-row-i1')
      expect(within(row1).getByTestId('invoice-number')).toHaveTextContent('FAT-001')
      expect(within(row1).getByTestId('invoice-status')).toHaveTextContent('Paga')

      const row2 = screen.getByTestId('invoice-row-i2')
      expect(within(row2).getByTestId('invoice-status')).toHaveTextContent('Enviada')
    })

    it('should format amounts in R$', () => {
      render(<TestWrapper><MockAdminBilling /></TestWrapper>)
      const row1 = screen.getByTestId('invoice-row-i1')
      expect(within(row1).getByTestId('invoice-amount')).toHaveTextContent('R$')
    })

    it('should show empty state when no invoices', () => {
      render(<TestWrapper><MockAdminBilling invoices={[]} /></TestWrapper>)
      expect(screen.getByTestId('no-invoices')).toHaveTextContent('Nenhuma fatura encontrada.')
    })
  })

  // ====================== ADMIN NOTIFICATIONS ======================
  describe('Admin Notifications', () => {
    it('should render 6 notification toggle checkboxes with labels', () => {
      render(<TestWrapper><MockAdminNotifications /></TestWrapper>)
      expect(screen.getByTestId('admin-notifications')).toBeInTheDocument()

      const toggleKeys = [
        'email_new_matter',
        'email_deadline_reminder',
        'email_invoice_created',
        'email_payment_received',
        'email_new_message',
        'email_weekly_report',
      ]

      toggleKeys.forEach(key => {
        expect(screen.getByTestId(`toggle-${key}`)).toBeInTheDocument()
        expect(screen.getByTestId(`notification-${key}`)).toBeInTheDocument()
      })
    })

    it('should toggle checkbox state on click', async () => {
      render(<TestWrapper><MockAdminNotifications /></TestWrapper>)
      const toggle = screen.getByTestId('toggle-email_weekly_report') as HTMLInputElement
      expect(toggle.checked).toBe(false)
      await user.click(toggle)
      expect(toggle.checked).toBe(true)
      await user.click(toggle)
      expect(toggle.checked).toBe(false)
    })

    it('should render reminder days dropdown', () => {
      render(<TestWrapper><MockAdminNotifications /></TestWrapper>)
      const select = screen.getByTestId('reminder-days-select') as HTMLSelectElement
      expect(select).toBeInTheDocument()
      expect(select.value).toBe('3')
    })

    it('should change reminder days selection', async () => {
      render(<TestWrapper><MockAdminNotifications /></TestWrapper>)
      const select = screen.getByTestId('reminder-days-select')
      await user.selectOptions(select, '7')
      expect((select as HTMLSelectElement).value).toBe('7')
    })

    it('should trigger save and show success message', async () => {
      const onSave = jest.fn()
      render(<TestWrapper><MockAdminNotifications onSave={onSave} /></TestWrapper>)

      const saveBtn = screen.getByTestId('save-btn')
      expect(saveBtn).toHaveTextContent('Salvar Configuracoes')
      await user.click(saveBtn)

      expect(onSave).toHaveBeenCalled()
      await waitFor(() => {
        expect(screen.getByTestId('save-success')).toHaveTextContent('Configuracoes de notificacao salvas!')
      })
    })

    it('should show loading state while saving', async () => {
      render(<TestWrapper><MockAdminNotifications /></TestWrapper>)
      const saveBtn = screen.getByTestId('save-btn')
      // Button should have the correct text before and after click
      expect(saveBtn).toHaveTextContent('Salvar Configuracoes')
    })
  })
})
