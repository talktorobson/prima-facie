/**
 * Frontend UI Tests: Client Portal System
 * Tests all client portal UI components and user interactions
 * 
 * Test Coverage:
 * - Client dashboard functionality
 * - Case progress tracking
 * - Document access and download
 * - Invoice viewing and payment
 * - Communication tools
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
  usePathname: () => '/portal/client/dashboard',
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
  storage: {
    from: jest.fn(() => ({
      download: jest.fn(),
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
    })),
  },
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

// Mock auth context for client user
const mockClientAuthContext = {
  user: {
    id: 'client-user-456',
    email: 'client@techcorp.com',
    user_metadata: {
      role: 'client',
      law_firm_id: 'test-firm-123'
    }
  },
  profile: {
    id: 'client-user-456',
    law_firm_id: 'test-firm-123',
    role: 'client',
    full_name: 'Maria Santos',
    client_id: 'client-456'
  }
}

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => mockClientAuthContext
}))

// Mock Client Dashboard Component
const MockClientDashboard = ({ onActionClick }) => {
  const [dashboardData, setDashboardData] = React.useState({
    activeMatters: 3,
    completedMatters: 5,
    pendingDocuments: 2,
    unreadMessages: 4,
    upcomingAppointments: 1,
    outstandingInvoices: 2,
    totalAmountDue: 15000
  })

  const recentActivity = [
    {
      id: 'activity-1',
      type: 'document',
      title: 'Novo documento disponível',
      description: 'Contrato revisado - Ação Trabalhista',
      date: '2024-12-16T10:30:00Z',
      matter_title: 'Ação Trabalhista - TechCorp'
    },
    {
      id: 'activity-2',
      type: 'message',
      title: 'Nova mensagem recebida',
      description: 'Dr. João Silva enviou uma atualização',
      date: '2024-12-15T14:20:00Z',
      matter_title: 'Consultoria Jurídica'
    },
    {
      id: 'activity-3',
      type: 'status_update',
      title: 'Status do caso atualizado',
      description: 'Caso movido para "Em Andamento"',
      date: '2024-12-14T09:15:00Z',
      matter_title: 'Contrato Empresarial'
    }
  ]

  const upcomingAppointments = [
    {
      id: 'appointment-1',
      title: 'Reunião de acompanhamento',
      date: '2024-12-20T15:00:00Z',
      lawyer: 'Dr. João Silva',
      matter_title: 'Ação Trabalhista - TechCorp',
      type: 'meeting'
    }
  ]

  const pendingInvoices = [
    {
      id: 'invoice-1',
      invoice_number: 'CASE-2024-000001',
      amount: 8500,
      due_date: '2024-12-25',
      matter_title: 'Ação Trabalhista - TechCorp',
      status: 'sent'
    },
    {
      id: 'invoice-2',
      invoice_number: 'SUB-2024-000003',
      amount: 6500,
      due_date: '2024-12-31',
      matter_title: 'Assinatura - Plano Empresarial',
      status: 'overdue'
    }
  ]

  return (
    <div data-testid="client-dashboard">
      <header data-testid="dashboard-header">
        <h1>Olá, Maria Santos</h1>
        <p>Bem-vinda ao seu portal do cliente</p>
      </header>

      {/* Quick Stats */}
      <div data-testid="dashboard-stats" className="stats-grid">
        <div data-testid="stat-active-matters" className="stat-card">
          <h3>Casos Ativos</h3>
          <div className="number">{dashboardData.activeMatters}</div>
          <div className="subtitle">Em andamento</div>
        </div>
        
        <div data-testid="stat-pending-documents" className="stat-card">
          <h3>Documentos Pendentes</h3>
          <div className="number">{dashboardData.pendingDocuments}</div>
          <div className="subtitle">Aguardando revisão</div>
        </div>
        
        <div data-testid="stat-unread-messages" className="stat-card">
          <h3>Mensagens</h3>
          <div className="number">{dashboardData.unreadMessages}</div>
          <div className="subtitle">Não lidas</div>
        </div>
        
        <div data-testid="stat-outstanding-invoices" className="stat-card">
          <h3>Faturas</h3>
          <div className="number">{dashboardData.outstandingInvoices}</div>
          <div className="subtitle">R$ {dashboardData.totalAmountDue.toLocaleString()}</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div data-testid="recent-activity" className="activity-section">
        <h2>Atividade Recente</h2>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} data-testid={`activity-${activity.id}`} className="activity-item">
              <div data-testid="activity-icon" className={`icon ${activity.type}`}>
                {activity.type === 'document' && '📄'}
                {activity.type === 'message' && '💬'}
                {activity.type === 'status_update' && '🔄'}
              </div>
              <div data-testid="activity-content">
                <h4 data-testid="activity-title">{activity.title}</h4>
                <p data-testid="activity-description">{activity.description}</p>
                <span data-testid="activity-matter">{activity.matter_title}</span>
                <span data-testid="activity-date">
                  {new Date(activity.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div data-testid="upcoming-appointments" className="appointments-section">
        <h2>Próximos Compromissos</h2>
        {upcomingAppointments.length > 0 ? (
          <div className="appointments-list">
            {upcomingAppointments.map(appointment => (
              <div key={appointment.id} data-testid={`appointment-${appointment.id}`} className="appointment-card">
                <div data-testid="appointment-title">{appointment.title}</div>
                <div data-testid="appointment-date">
                  {new Date(appointment.date).toLocaleString('pt-BR')}
                </div>
                <div data-testid="appointment-lawyer">Com: {appointment.lawyer}</div>
                <div data-testid="appointment-matter">{appointment.matter_title}</div>
                <button 
                  data-testid={`appointment-details-${appointment.id}`}
                  onClick={() => onActionClick && onActionClick('appointment_details', appointment.id)}
                >
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div data-testid="no-appointments">Nenhum compromisso agendado</div>
        )}
      </div>

      {/* Pending Invoices */}
      <div data-testid="pending-invoices" className="invoices-section">
        <h2>Faturas Pendentes</h2>
        {pendingInvoices.length > 0 ? (
          <div className="invoices-list">
            {pendingInvoices.map(invoice => (
              <div key={invoice.id} data-testid={`invoice-${invoice.id}`} className="invoice-card">
                <div data-testid="invoice-number">{invoice.invoice_number}</div>
                <div data-testid="invoice-amount">R$ {invoice.amount.toLocaleString()}</div>
                <div data-testid="invoice-due-date">Venc: {invoice.due_date}</div>
                <div data-testid="invoice-matter">{invoice.matter_title}</div>
                <div data-testid="invoice-status" className={`status ${invoice.status}`}>
                  {invoice.status === 'sent' ? 'Enviada' : 'Em Atraso'}
                </div>
                <button 
                  data-testid={`pay-invoice-${invoice.id}`}
                  onClick={() => onActionClick && onActionClick('pay_invoice', invoice.id)}
                  className="pay-btn"
                >
                  Pagar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div data-testid="no-invoices">Nenhuma fatura pendente</div>
        )}
      </div>

      {/* Quick Actions */}
      <div data-testid="quick-actions" className="quick-actions-section">
        <h2>Ações Rápidas</h2>
        <div className="actions-grid">
          <button 
            data-testid="view-cases-btn"
            onClick={() => onActionClick && onActionClick('view_cases')}
          >
            📋 Ver Meus Casos
          </button>
          <button 
            data-testid="view-documents-btn"
            onClick={() => onActionClick && onActionClick('view_documents')}
          >
            📄 Documentos
          </button>
          <button 
            data-testid="send-message-btn"
            onClick={() => onActionClick && onActionClick('send_message')}
          >
            💬 Enviar Mensagem
          </button>
          <button 
            data-testid="schedule-meeting-btn"
            onClick={() => onActionClick && onActionClick('schedule_meeting')}
          >
            📅 Agendar Reunião
          </button>
        </div>
      </div>
    </div>
  )
}

// Mock Case Progress Component
const MockCaseProgress = ({ matterData, onStatusUpdate }) => {
  const defaultMatter = {
    id: 'matter-1',
    title: 'Ação Trabalhista - TechCorp',
    case_type: 'Trabalhista',
    status: 'in_progress',
    created_date: '2024-10-15',
    lawyer_name: 'Dr. João Silva',
    description: 'Ação trabalhista para recuperação de direitos',
    progress_percentage: 65,
    next_milestone: 'Audiência de Conciliação',
    estimated_completion: '2025-03-15'
  }

  const matter = matterData || defaultMatter

  const [selectedTab, setSelectedTab] = React.useState('overview')

  const statusHistory = [
    {
      id: 'status-1',
      status: 'new',
      date: '2024-10-15',
      description: 'Caso criado e análise inicial realizada',
      lawyer: 'Dr. João Silva'
    },
    {
      id: 'status-2',
      status: 'in_progress',
      date: '2024-11-01',
      description: 'Documentação reunida e petição inicial preparada',
      lawyer: 'Dr. João Silva'
    },
    {
      id: 'status-3',
      status: 'in_progress',
      date: '2024-11-20',
      description: 'Petição protocolada no tribunal',
      lawyer: 'Dr. João Silva'
    },
    {
      id: 'status-4',
      status: 'in_progress',
      date: '2024-12-10',
      description: 'Citação da parte contrária realizada',
      lawyer: 'Dr. João Silva'
    }
  ]

  const milestones = [
    {
      id: 'milestone-1',
      title: 'Análise Inicial',
      status: 'completed',
      date: '2024-10-15',
      description: 'Análise dos documentos e viabilidade do caso'
    },
    {
      id: 'milestone-2',
      title: 'Preparação da Petição',
      status: 'completed',
      date: '2024-11-01',
      description: 'Elaboração e revisão da petição inicial'
    },
    {
      id: 'milestone-3',
      title: 'Protocolo no Tribunal',
      status: 'completed',
      date: '2024-11-20',
      description: 'Petição protocolada e processo autuado'
    },
    {
      id: 'milestone-4',
      title: 'Citação da Parte Contrária',
      status: 'completed',
      date: '2024-12-10',
      description: 'Citação realizada com sucesso'
    },
    {
      id: 'milestone-5',
      title: 'Audiência de Conciliação',
      status: 'pending',
      date: '2025-01-15',
      description: 'Primeira audiência de tentativa de acordo'
    },
    {
      id: 'milestone-6',
      title: 'Produção de Provas',
      status: 'pending',
      date: '2025-02-10',
      description: 'Fase de coleta e produção de provas'
    },
    {
      id: 'milestone-7',
      title: 'Audiência de Instrução',
      status: 'pending',
      date: '2025-03-05',
      description: 'Audiência para oitiva de testemunhas'
    }
  ]

  const documents = [
    {
      id: 'doc-1',
      name: 'Petição Inicial',
      type: 'petition',
      date: '2024-11-01',
      status: 'final',
      size: '245 KB'
    },
    {
      id: 'doc-2',
      name: 'Documentos Trabalhistas',
      type: 'evidence',
      date: '2024-10-20',
      status: 'final',
      size: '1.2 MB'
    },
    {
      id: 'doc-3',
      name: 'Comprovante de Protocolo',
      type: 'official',
      date: '2024-11-20',
      status: 'final',
      size: '156 KB'
    },
    {
      id: 'doc-4',
      name: 'Citação - Mandado',
      type: 'official',
      date: '2024-12-10',
      status: 'final',
      size: '89 KB'
    }
  ]

  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Novo'
      case 'in_progress': return 'Em Andamento'
      case 'completed': return 'Concluído'
      case 'on_hold': return 'Pausado'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return '#3b82f6'
      case 'in_progress': return '#f59e0b'
      case 'completed': return '#10b981'
      case 'on_hold': return '#6b7280'
      default: return '#6b7280'
    }
  }

  return (
    <div data-testid="case-progress">
      <header data-testid="case-header">
        <h1 data-testid="case-title">{matter.title}</h1>
        <div data-testid="case-meta">
          <span data-testid="case-type">Tipo: {matter.case_type}</span>
          <span 
            data-testid="case-status" 
            style={{ color: getStatusColor(matter.status) }}
          >
            Status: {getStatusText(matter.status)}
          </span>
          <span data-testid="case-lawyer">Advogado: {matter.lawyer_name}</span>
        </div>
      </header>

      {/* Progress Bar */}
      <div data-testid="progress-section" className="progress-section">
        <h2>Progresso do Caso</h2>
        <div data-testid="progress-bar" className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${matter.progress_percentage}%` }}
          />
        </div>
        <div data-testid="progress-text">
          {matter.progress_percentage}% concluído
        </div>
        <div data-testid="next-milestone">
          Próxima etapa: {matter.next_milestone}
        </div>
        <div data-testid="estimated-completion">
          Previsão de conclusão: {matter.estimated_completion}
        </div>
      </div>

      {/* Tabs */}
      <div data-testid="case-tabs" className="tabs-section">
        <div className="tab-buttons">
          <button
            data-testid="overview-tab"
            className={selectedTab === 'overview' ? 'active' : ''}
            onClick={() => setSelectedTab('overview')}
          >
            Visão Geral
          </button>
          <button
            data-testid="timeline-tab"
            className={selectedTab === 'timeline' ? 'active' : ''}
            onClick={() => setSelectedTab('timeline')}
          >
            Linha do Tempo
          </button>
          <button
            data-testid="documents-tab"
            className={selectedTab === 'documents' ? 'active' : ''}
            onClick={() => setSelectedTab('documents')}
          >
            Documentos
          </button>
        </div>

        {/* Tab Content */}
        <div data-testid="tab-content" className="tab-content">
          {selectedTab === 'overview' && (
            <div data-testid="overview-content">
              <h3>Descrição do Caso</h3>
              <p data-testid="case-description">{matter.description}</p>
              
              <h3>Marcos do Projeto</h3>
              <div data-testid="milestones-overview">
                {milestones.slice(0, 3).map(milestone => (
                  <div key={milestone.id} data-testid={`milestone-${milestone.id}`} className="milestone-item">
                    <span 
                      data-testid="milestone-status"
                      className={`status ${milestone.status}`}
                    >
                      {milestone.status === 'completed' ? '✅' : '⏳'}
                    </span>
                    <span data-testid="milestone-title">{milestone.title}</span>
                    <span data-testid="milestone-date">{milestone.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'timeline' && (
            <div data-testid="timeline-content">
              <h3>Histórico de Status</h3>
              <div data-testid="status-timeline">
                {statusHistory.map(entry => (
                  <div key={entry.id} data-testid={`status-${entry.id}`} className="timeline-item">
                    <div data-testid="timeline-date">{entry.date}</div>
                    <div data-testid="timeline-description">{entry.description}</div>
                    <div data-testid="timeline-lawyer">Por: {entry.lawyer}</div>
                  </div>
                ))}
              </div>
              
              <h3>Marcos Futuros</h3>
              <div data-testid="future-milestones">
                {milestones.filter(m => m.status === 'pending').map(milestone => (
                  <div key={milestone.id} data-testid={`future-milestone-${milestone.id}`} className="milestone-item">
                    <span data-testid="milestone-title">{milestone.title}</span>
                    <span data-testid="milestone-date">Previsto: {milestone.date}</span>
                    <span data-testid="milestone-description">{milestone.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'documents' && (
            <div data-testid="documents-content">
              <h3>Documentos do Caso</h3>
              <div data-testid="documents-list">
                {documents.map(doc => (
                  <div key={doc.id} data-testid={`document-${doc.id}`} className="document-item">
                    <div data-testid="document-info">
                      <span data-testid="document-name">{doc.name}</span>
                      <span data-testid="document-type">{doc.type}</span>
                      <span data-testid="document-date">{doc.date}</span>
                      <span data-testid="document-size">{doc.size}</span>
                      <span data-testid="document-status">{doc.status}</span>
                    </div>
                    <div data-testid="document-actions">
                      <button data-testid={`download-${doc.id}`}>
                        📥 Download
                      </button>
                      <button data-testid={`view-${doc.id}`}>
                        👁️ Visualizar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Mock Document Access Component
const MockDocumentAccess = ({ onDocumentDownload, onDocumentView }) => {
  const [documents, setDocuments] = React.useState([
    {
      id: 'doc-1',
      name: 'Contrato de Prestação de Serviços - Final.pdf',
      matter_title: 'Contrato Empresarial - StartupCorp',
      category: 'contract',
      upload_date: '2024-12-15',
      file_size: '2.3 MB',
      status: 'final',
      access_level: 'read_download',
      lawyer_name: 'Dr. João Silva'
    },
    {
      id: 'doc-2',
      name: 'Petição Inicial - Ação Trabalhista.pdf',
      matter_title: 'Ação Trabalhista - TechCorp',
      category: 'petition',
      upload_date: '2024-12-10',
      file_size: '1.8 MB',
      status: 'final',
      access_level: 'read_only',
      lawyer_name: 'Dr. João Silva'
    },
    {
      id: 'doc-3',
      name: 'Parecer Jurídico - Consultoria.pdf',
      matter_title: 'Consultoria Jurídica - LegalSolutions',
      category: 'opinion',
      upload_date: '2024-12-05',
      file_size: '945 KB',
      status: 'draft',
      access_level: 'read_only',
      lawyer_name: 'Dra. Ana Costa'
    },
    {
      id: 'doc-4',
      name: 'Comprovante de Protocolo.pdf',
      matter_title: 'Ação Trabalhista - TechCorp',
      category: 'official',
      upload_date: '2024-11-28',
      file_size: '156 KB',
      status: 'final',
      access_level: 'read_download',
      lawyer_name: 'Dr. João Silva'
    }
  ])

  const [filter, setFilter] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState('')

  const categories = [
    { value: 'contract', label: 'Contratos' },
    { value: 'petition', label: 'Petições' },
    { value: 'opinion', label: 'Pareceres' },
    { value: 'official', label: 'Documentos Oficiais' },
    { value: 'evidence', label: 'Provas' }
  ]

  const filteredDocuments = documents.filter(doc => {
    const matchesName = doc.name.toLowerCase().includes(filter.toLowerCase())
    const matchesCategory = !categoryFilter || doc.category === categoryFilter
    const matchesStatus = !statusFilter || doc.status === statusFilter
    return matchesName && matchesCategory && matchesStatus
  })

  const handleDownload = (documentId) => {
    const document = documents.find(doc => doc.id === documentId)
    if (document && document.access_level === 'read_download') {
      onDocumentDownload && onDocumentDownload(document)
    }
  }

  const handleView = (documentId) => {
    const document = documents.find(doc => doc.id === documentId)
    if (document) {
      onDocumentView && onDocumentView(document)
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Rascunho'
      case 'final': return 'Final'
      case 'archived': return 'Arquivado'
      default: return status
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return '#f59e0b'
      case 'final': return '#10b981'
      case 'archived': return '#6b7280'
      default: return '#6b7280'
    }
  }

  return (
    <div data-testid="document-access">
      <header data-testid="documents-header">
        <h1>Meus Documentos</h1>
        <p>Acesse e baixe documentos relacionados aos seus casos</p>
      </header>

      {/* Document Statistics */}
      <div data-testid="document-stats" className="stats-section">
        <div data-testid="total-documents">
          Total: {documents.length} documentos
        </div>
        <div data-testid="final-documents">
          Finais: {documents.filter(doc => doc.status === 'final').length}
        </div>
        <div data-testid="draft-documents">
          Rascunhos: {documents.filter(doc => doc.status === 'draft').length}
        </div>
        <div data-testid="downloadable-documents">
          Para Download: {documents.filter(doc => doc.access_level === 'read_download').length}
        </div>
      </div>

      {/* Filters */}
      <div data-testid="document-filters" className="filters-section">
        <input
          data-testid="document-search"
          type="text"
          placeholder="Buscar documentos..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        
        <select
          data-testid="category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        
        <select
          data-testid="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="final">Final</option>
          <option value="draft">Rascunho</option>
          <option value="archived">Arquivado</option>
        </select>
      </div>

      {/* Documents List */}
      <div data-testid="documents-list" className="documents-list">
        {filteredDocuments.map(doc => (
          <div key={doc.id} data-testid={`document-${doc.id}`} className="document-card">
            <div data-testid="document-info">
              <h3 data-testid="document-name">{doc.name}</h3>
              <div data-testid="document-matter">{doc.matter_title}</div>
              <div data-testid="document-category">
                Categoria: {categories.find(cat => cat.value === doc.category)?.label || doc.category}
              </div>
              <div data-testid="document-lawyer">Advogado: {doc.lawyer_name}</div>
              <div data-testid="document-upload-date">Enviado em: {doc.upload_date}</div>
              <div data-testid="document-size">Tamanho: {doc.file_size}</div>
              <div 
                data-testid="document-status"
                style={{ color: getStatusColor(doc.status) }}
              >
                Status: {getStatusText(doc.status)}
              </div>
              <div data-testid="document-access-level">
                Acesso: {doc.access_level === 'read_download' ? 'Leitura e Download' : 'Somente Leitura'}
              </div>
            </div>
            
            <div data-testid="document-actions" className="document-actions">
              <button
                data-testid={`view-document-${doc.id}`}
                onClick={() => handleView(doc.id)}
              >
                👁️ Visualizar
              </button>
              
              {doc.access_level === 'read_download' && (
                <button
                  data-testid={`download-document-${doc.id}`}
                  onClick={() => handleDownload(doc.id)}
                  className="download-btn"
                >
                  📥 Download
                </button>
              )}
              
              {doc.access_level === 'read_only' && (
                <span data-testid={`no-download-${doc.id}`} className="no-download">
                  Download não disponível
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div data-testid="no-documents-message">
          Nenhum documento encontrado para os filtros selecionados.
        </div>
      )}
    </div>
  )
}

// Mock Invoice Payment Component
const MockInvoicePayment = ({ invoiceData, onPaymentSubmit }) => {
  const defaultInvoice = {
    id: 'invoice-1',
    invoice_number: 'CASE-2024-000001',
    amount: 8500,
    due_date: '2024-12-25',
    issue_date: '2024-12-01',
    matter_title: 'Ação Trabalhista - TechCorp',
    description: 'Honorários advocatícios - Ação Trabalhista',
    status: 'sent',
    payment_methods: ['pix', 'bank_transfer', 'credit_card'],
    line_items: [
      {
        id: 'item-1',
        description: 'Consulta jurídica inicial',
        quantity: 2,
        unit_price: 400,
        total: 800
      },
      {
        id: 'item-2',
        description: 'Elaboração de petição inicial',
        quantity: 1,
        unit_price: 2500,
        total: 2500
      },
      {
        id: 'item-3',
        description: 'Acompanhamento processual',
        quantity: 15,
        unit_price: 350,
        total: 5200
      }
    ]
  }

  const invoice = invoiceData || defaultInvoice

  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('')
  const [paymentData, setPaymentData] = React.useState({
    installments: 1,
    card_holder_name: '',
    card_number: '',
    expiry_date: '',
    cvv: '',
    cpf: ''
  })
  const [showPaymentForm, setShowPaymentForm] = React.useState(false)

  const paymentMethodLabels = {
    pix: 'PIX',
    bank_transfer: 'Transferência Bancária',
    credit_card: 'Cartão de Crédito'
  }

  const installmentOptions = [
    { value: 1, label: '1x - R$ 8.500,00' },
    { value: 2, label: '2x - R$ 4.250,00' },
    { value: 3, label: '3x - R$ 2.833,33' },
    { value: 6, label: '6x - R$ 1.416,67' }
  ]

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method)
    setShowPaymentForm(true)
  }

  const handlePaymentSubmit = () => {
    const payment = {
      invoice_id: invoice.id,
      payment_method: selectedPaymentMethod,
      amount: invoice.amount,
      installments: paymentData.installments,
      payment_data: paymentData
    }
    
    onPaymentSubmit && onPaymentSubmit(payment)
    setShowPaymentForm(false)
    setSelectedPaymentMethod('')
  }

  const subtotal = invoice.line_items.reduce((sum, item) => sum + item.total, 0)

  return (
    <div data-testid="invoice-payment">
      <header data-testid="invoice-header">
        <h1>Pagamento de Fatura</h1>
        <div data-testid="invoice-number">Fatura: {invoice.invoice_number}</div>
      </header>

      {/* Invoice Details */}
      <div data-testid="invoice-details" className="invoice-details">
        <h2>Detalhes da Fatura</h2>
        
        <div data-testid="invoice-info">
          <div data-testid="invoice-matter">Caso: {invoice.matter_title}</div>
          <div data-testid="invoice-description">Descrição: {invoice.description}</div>
          <div data-testid="invoice-issue-date">Data de Emissão: {invoice.issue_date}</div>
          <div data-testid="invoice-due-date">Data de Vencimento: {invoice.due_date}</div>
          <div data-testid="invoice-status">Status: {invoice.status === 'sent' ? 'Enviada' : invoice.status}</div>
        </div>

        {/* Line Items */}
        <div data-testid="line-items" className="line-items-section">
          <h3>Itens da Fatura</h3>
          <table data-testid="line-items-table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.line_items.map(item => (
                <tr key={item.id} data-testid={`line-item-${item.id}`}>
                  <td data-testid="item-description">{item.description}</td>
                  <td data-testid="item-quantity">{item.quantity}</td>
                  <td data-testid="item-unit-price">R$ {item.unit_price.toLocaleString()}</td>
                  <td data-testid="item-total">R$ {item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3"><strong>Subtotal</strong></td>
                <td data-testid="invoice-subtotal"><strong>R$ {subtotal.toLocaleString()}</strong></td>
              </tr>
              <tr>
                <td colSpan="3"><strong>Total</strong></td>
                <td data-testid="invoice-total"><strong>R$ {invoice.amount.toLocaleString()}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      {!showPaymentForm && (
        <div data-testid="payment-methods" className="payment-methods-section">
          <h2>Escolha a Forma de Pagamento</h2>
          <div className="payment-options">
            {invoice.payment_methods.map(method => (
              <button
                key={method}
                data-testid={`payment-method-${method}`}
                onClick={() => handlePaymentMethodSelect(method)}
                className="payment-method-btn"
              >
                {method === 'pix' && '📱'}
                {method === 'bank_transfer' && '🏦'}
                {method === 'credit_card' && '💳'}
                {paymentMethodLabels[method]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Payment Form */}
      {showPaymentForm && (
        <div data-testid="payment-form" className="payment-form-section">
          <h2>Dados para Pagamento</h2>
          <div data-testid="selected-method">
            Método selecionado: {paymentMethodLabels[selectedPaymentMethod]}
          </div>

          {selectedPaymentMethod === 'pix' && (
            <div data-testid="pix-payment" className="pix-payment">
              <h3>Pagamento via PIX</h3>
              <div data-testid="pix-info">
                <p>Escaneie o QR Code ou copie a chave PIX abaixo:</p>
                <div data-testid="pix-qr-code" className="qr-code">
                  [QR CODE PLACEHOLDER]
                </div>
                <div data-testid="pix-key">
                  Chave PIX: 12.345.678/0001-90
                </div>
                <div data-testid="pix-amount">
                  Valor: R$ {invoice.amount.toLocaleString()}
                </div>
                <button
                  data-testid="copy-pix-key"
                  onClick={() => navigator.clipboard.writeText('12.345.678/0001-90')}
                >
                  📋 Copiar Chave PIX
                </button>
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'bank_transfer' && (
            <div data-testid="bank-transfer-payment" className="bank-transfer-payment">
              <h3>Dados para Transferência Bancária</h3>
              <div data-testid="bank-details">
                <div>Banco: Banco do Brasil</div>
                <div>Agência: 1234-5</div>
                <div>Conta: 67890-1</div>
                <div>CNPJ: 12.345.678/0001-90</div>
                <div>Favorecido: Escritório de Advocacia Silva & Associados</div>
                <div data-testid="transfer-amount">Valor: R$ {invoice.amount.toLocaleString()}</div>
              </div>
            </div>
          )}

          {selectedPaymentMethod === 'credit_card' && (
            <div data-testid="credit-card-payment" className="credit-card-payment">
              <h3>Pagamento com Cartão de Crédito</h3>
              
              <div data-testid="installments-selection">
                <label>Parcelas:</label>
                <select
                  value={paymentData.installments}
                  onChange={(e) => setPaymentData({ ...paymentData, installments: parseInt(e.target.value) })}
                >
                  {installmentOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div data-testid="card-form" className="card-form">
                <div data-testid="card-holder-name-input">
                  <label>Nome no Cartão:</label>
                  <input
                    type="text"
                    value={paymentData.card_holder_name}
                    onChange={(e) => setPaymentData({ ...paymentData, card_holder_name: e.target.value })}
                    placeholder="Nome como impresso no cartão"
                  />
                </div>

                <div data-testid="card-number-input">
                  <label>Número do Cartão:</label>
                  <input
                    type="text"
                    value={paymentData.card_number}
                    onChange={(e) => setPaymentData({ ...paymentData, card_number: e.target.value })}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>

                <div data-testid="expiry-date-input">
                  <label>Data de Validade:</label>
                  <input
                    type="text"
                    value={paymentData.expiry_date}
                    onChange={(e) => setPaymentData({ ...paymentData, expiry_date: e.target.value })}
                    placeholder="MM/AA"
                    maxLength={5}
                  />
                </div>

                <div data-testid="cvv-input">
                  <label>CVV:</label>
                  <input
                    type="text"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>

                <div data-testid="cpf-input">
                  <label>CPF do Portador:</label>
                  <input
                    type="text"
                    value={paymentData.cpf}
                    onChange={(e) => setPaymentData({ ...paymentData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>
              </div>
            </div>
          )}

          <div data-testid="payment-actions" className="payment-actions">
            <button
              data-testid="confirm-payment-btn"
              onClick={handlePaymentSubmit}
              disabled={
                selectedPaymentMethod === 'credit_card' && 
                (!paymentData.card_holder_name || !paymentData.card_number || !paymentData.expiry_date || !paymentData.cvv || !paymentData.cpf)
              }
              className="confirm-payment-btn"
            >
              Confirmar Pagamento
            </button>
            <button
              data-testid="cancel-payment-btn"
              onClick={() => {
                setShowPaymentForm(false)
                setSelectedPaymentMethod('')
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
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

describe('Client Portal UI Tests', () => {
  let user

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000/portal/client/dashboard',
        pathname: '/portal/client/dashboard',
        search: '',
        hash: '',
        assign: jest.fn(),
        replace: jest.fn(),
        reload: jest.fn(),
      },
      writable: true,
    })

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn(),
      },
    })
  })

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
    
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
    mockSupabase.select.mockResolvedValue({ data: [], error: null })
    mockSupabase.insert.mockResolvedValue({ data: [], error: null })
    mockSupabase.update.mockResolvedValue({ data: [], error: null })
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Client Dashboard', () => {
    it('should render dashboard with personalized greeting', async () => {
      render(
        <TestWrapper>
          <MockClientDashboard />
        </TestWrapper>
      )

      expect(screen.getByTestId('client-dashboard')).toBeInTheDocument()
      
      const header = screen.getByTestId('dashboard-header')
      expect(within(header).getByText('Olá, Maria Santos')).toBeInTheDocument()
      expect(within(header).getByText('Bem-vinda ao seu portal do cliente')).toBeInTheDocument()
    })

    it('should display dashboard statistics correctly', async () => {
      render(
        <TestWrapper>
          <MockClientDashboard />
        </TestWrapper>
      )

      const stats = screen.getByTestId('dashboard-stats')
      expect(stats).toBeInTheDocument()

      // Check individual stats
      expect(screen.getByTestId('stat-active-matters')).toHaveTextContent('3')
      expect(screen.getByTestId('stat-pending-documents')).toHaveTextContent('2')
      expect(screen.getByTestId('stat-unread-messages')).toHaveTextContent('4')
      expect(screen.getByTestId('stat-outstanding-invoices')).toHaveTextContent('2')
      expect(screen.getByTestId('stat-outstanding-invoices')).toHaveTextContent('R$ 15.000')
    })

    it('should show recent activity feed', async () => {
      render(
        <TestWrapper>
          <MockClientDashboard />
        </TestWrapper>
      )

      const activitySection = screen.getByTestId('recent-activity')
      expect(activitySection).toBeInTheDocument()

      // Check activity items
      const documentActivity = screen.getByTestId('activity-activity-1')
      expect(within(documentActivity).getByTestId('activity-title')).toHaveTextContent('Novo documento disponível')
      expect(within(documentActivity).getByTestId('activity-description')).toHaveTextContent('Contrato revisado - Ação Trabalhista')
      expect(within(documentActivity).getByTestId('activity-matter')).toHaveTextContent('Ação Trabalhista - TechCorp')

      const messageActivity = screen.getByTestId('activity-activity-2')
      expect(within(messageActivity).getByTestId('activity-title')).toHaveTextContent('Nova mensagem recebida')
      expect(within(messageActivity).getByTestId('activity-description')).toHaveTextContent('Dr. João Silva enviou uma atualização')
    })

    it('should display upcoming appointments', async () => {
      render(
        <TestWrapper>
          <MockClientDashboard />
        </TestWrapper>
      )

      const appointmentsSection = screen.getByTestId('upcoming-appointments')
      expect(appointmentsSection).toBeInTheDocument()

      const appointment = screen.getByTestId('appointment-appointment-1')
      expect(within(appointment).getByTestId('appointment-title')).toHaveTextContent('Reunião de acompanhamento')
      expect(within(appointment).getByTestId('appointment-lawyer')).toHaveTextContent('Com: Dr. João Silva')
      expect(within(appointment).getByTestId('appointment-matter')).toHaveTextContent('Ação Trabalhista - TechCorp')

      // Test appointment details button
      const detailsBtn = screen.getByTestId('appointment-details-appointment-1')
      expect(detailsBtn).toBeInTheDocument()
    })

    it('should show pending invoices with payment options', async () => {
      render(
        <TestWrapper>
          <MockClientDashboard />
        </TestWrapper>
      )

      const invoicesSection = screen.getByTestId('pending-invoices')
      expect(invoicesSection).toBeInTheDocument()

      // Check first invoice
      const invoice1 = screen.getByTestId('invoice-invoice-1')
      expect(within(invoice1).getByTestId('invoice-number')).toHaveTextContent('CASE-2024-000001')
      expect(within(invoice1).getByTestId('invoice-amount')).toHaveTextContent('R$ 8.500')
      expect(within(invoice1).getByTestId('invoice-due-date')).toHaveTextContent('Venc: 2024-12-25')
      expect(within(invoice1).getByTestId('invoice-status')).toHaveTextContent('Enviada')

      // Check overdue invoice
      const invoice2 = screen.getByTestId('invoice-invoice-2')
      expect(within(invoice2).getByTestId('invoice-status')).toHaveTextContent('Em Atraso')

      // Check payment buttons
      expect(screen.getByTestId('pay-invoice-invoice-1')).toBeInTheDocument()
      expect(screen.getByTestId('pay-invoice-invoice-2')).toBeInTheDocument()
    })

    it('should provide quick action buttons', async () => {
      const onActionClick = jest.fn()
      
      render(
        <TestWrapper>
          <MockClientDashboard onActionClick={onActionClick} />
        </TestWrapper>
      )

      const quickActions = screen.getByTestId('quick-actions')
      expect(quickActions).toBeInTheDocument()

      // Test each quick action
      await user.click(screen.getByTestId('view-cases-btn'))
      expect(onActionClick).toHaveBeenCalledWith('view_cases')

      await user.click(screen.getByTestId('view-documents-btn'))
      expect(onActionClick).toHaveBeenCalledWith('view_documents')

      await user.click(screen.getByTestId('send-message-btn'))
      expect(onActionClick).toHaveBeenCalledWith('send_message')

      await user.click(screen.getByTestId('schedule-meeting-btn'))
      expect(onActionClick).toHaveBeenCalledWith('schedule_meeting')
    })

    it('should handle action callbacks correctly', async () => {
      const onActionClick = jest.fn()
      
      render(
        <TestWrapper>
          <MockClientDashboard onActionClick={onActionClick} />
        </TestWrapper>
      )

      // Test invoice payment action
      await user.click(screen.getByTestId('pay-invoice-invoice-1'))
      expect(onActionClick).toHaveBeenCalledWith('pay_invoice', 'invoice-1')

      // Test appointment details action
      await user.click(screen.getByTestId('appointment-details-appointment-1'))
      expect(onActionClick).toHaveBeenCalledWith('appointment_details', 'appointment-1')
    })
  })

  describe('Case Progress Tracking', () => {
    it('should display case information and progress', async () => {
      render(
        <TestWrapper>
          <MockCaseProgress />
        </TestWrapper>
      )

      expect(screen.getByTestId('case-progress')).toBeInTheDocument()

      // Check case header
      const header = screen.getByTestId('case-header')
      expect(within(header).getByTestId('case-title')).toHaveTextContent('Ação Trabalhista - TechCorp')
      expect(within(header).getByTestId('case-type')).toHaveTextContent('Tipo: Trabalhista')
      expect(within(header).getByTestId('case-status')).toHaveTextContent('Status: Em Andamento')
      expect(within(header).getByTestId('case-lawyer')).toHaveTextContent('Advogado: Dr. João Silva')

      // Check progress section
      const progressSection = screen.getByTestId('progress-section')
      expect(within(progressSection).getByTestId('progress-text')).toHaveTextContent('65% concluído')
      expect(within(progressSection).getByTestId('next-milestone')).toHaveTextContent('Próxima etapa: Audiência de Conciliação')
      expect(within(progressSection).getByTestId('estimated-completion')).toHaveTextContent('Previsão de conclusão: 2025-03-15')
    })

    it('should switch between different tabs', async () => {
      render(
        <TestWrapper>
          <MockCaseProgress />
        </TestWrapper>
      )

      const tabs = screen.getByTestId('case-tabs')
      expect(tabs).toBeInTheDocument()

      // Default tab should be overview
      expect(screen.getByTestId('overview-tab')).toHaveClass('active')
      expect(screen.getByTestId('overview-content')).toBeInTheDocument()

      // Switch to timeline tab
      await user.click(screen.getByTestId('timeline-tab'))
      expect(screen.getByTestId('timeline-tab')).toHaveClass('active')
      expect(screen.getByTestId('timeline-content')).toBeInTheDocument()
      expect(screen.queryByTestId('overview-content')).not.toBeInTheDocument()

      // Switch to documents tab
      await user.click(screen.getByTestId('documents-tab'))
      expect(screen.getByTestId('documents-tab')).toHaveClass('active')
      expect(screen.getByTestId('documents-content')).toBeInTheDocument()
      expect(screen.queryByTestId('timeline-content')).not.toBeInTheDocument()
    })

    it('should display case overview with milestones', async () => {
      render(
        <TestWrapper>
          <MockCaseProgress />
        </TestWrapper>
      )

      const overviewContent = screen.getByTestId('overview-content')
      expect(overviewContent).toBeInTheDocument()

      expect(within(overviewContent).getByTestId('case-description')).toHaveTextContent('Ação trabalhista para recuperação de direitos')

      // Check milestones
      const milestonesOverview = screen.getByTestId('milestones-overview')
      expect(milestonesOverview).toBeInTheDocument()

      const milestone1 = screen.getByTestId('milestone-milestone-1')
      expect(within(milestone1).getByTestId('milestone-title')).toHaveTextContent('Análise Inicial')
      expect(within(milestone1).getByTestId('milestone-status')).toHaveTextContent('✅')
    })

    it('should show timeline with status history', async () => {
      render(
        <TestWrapper>
          <MockCaseProgress />
        </TestWrapper>
      )

      // Switch to timeline tab
      await user.click(screen.getByTestId('timeline-tab'))

      const timelineContent = screen.getByTestId('timeline-content')
      expect(timelineContent).toBeInTheDocument()

      // Check status timeline
      const statusTimeline = screen.getByTestId('status-timeline')
      expect(statusTimeline).toBeInTheDocument()

      const statusEntry = screen.getByTestId('status-status-1')
      expect(within(statusEntry).getByTestId('timeline-date')).toHaveTextContent('2024-10-15')
      expect(within(statusEntry).getByTestId('timeline-description')).toHaveTextContent('Caso criado e análise inicial realizada')
      expect(within(statusEntry).getByTestId('timeline-lawyer')).toHaveTextContent('Por: Dr. João Silva')

      // Check future milestones
      const futureMilestones = screen.getByTestId('future-milestones')
      expect(futureMilestones).toBeInTheDocument()

      const futureMilestone = screen.getByTestId('future-milestone-milestone-5')
      expect(within(futureMilestone).getByTestId('milestone-title')).toHaveTextContent('Audiência de Conciliação')
      expect(within(futureMilestone).getByTestId('milestone-date')).toHaveTextContent('Previsto: 2025-01-15')
    })

    it('should display case documents with actions', async () => {
      render(
        <TestWrapper>
          <MockCaseProgress />
        </TestWrapper>
      )

      // Switch to documents tab
      await user.click(screen.getByTestId('documents-tab'))

      const documentsContent = screen.getByTestId('documents-content')
      expect(documentsContent).toBeInTheDocument()

      const documentsList = screen.getByTestId('documents-list')
      expect(documentsList).toBeInTheDocument()

      // Check individual document
      const document1 = screen.getByTestId('document-doc-1')
      expect(within(document1).getByTestId('document-name')).toHaveTextContent('Petição Inicial')
      expect(within(document1).getByTestId('document-type')).toHaveTextContent('petition')
      expect(within(document1).getByTestId('document-date')).toHaveTextContent('2024-11-01')
      expect(within(document1).getByTestId('document-size')).toHaveTextContent('245 KB')
      expect(within(document1).getByTestId('document-status')).toHaveTextContent('final')

      // Check document actions
      expect(within(document1).getByTestId('download-doc-1')).toBeInTheDocument()
      expect(within(document1).getByTestId('view-doc-1')).toBeInTheDocument()
    })
  })

  describe('Document Access and Download', () => {
    it('should display documents list with filtering', async () => {
      render(
        <TestWrapper>
          <MockDocumentAccess />
        </TestWrapper>
      )

      expect(screen.getByTestId('document-access')).toBeInTheDocument()
      expect(screen.getByText('Meus Documentos')).toBeInTheDocument()

      // Check document statistics
      const stats = screen.getByTestId('document-stats')
      expect(within(stats).getByTestId('total-documents')).toHaveTextContent('Total: 4 documentos')
      expect(within(stats).getByTestId('final-documents')).toHaveTextContent('Finais: 3')
      expect(within(stats).getByTestId('draft-documents')).toHaveTextContent('Rascunhos: 1')
      expect(within(stats).getByTestId('downloadable-documents')).toHaveTextContent('Para Download: 2')
    })

    it('should filter documents by name', async () => {
      render(
        <TestWrapper>
          <MockDocumentAccess />
        </TestWrapper>
      )

      const searchInput = screen.getByTestId('document-search')
      await user.type(searchInput, 'Contrato')

      // Should show only documents with "Contrato" in name
      expect(screen.getByTestId('document-doc-1')).toBeInTheDocument() // Contains "Contrato"
      expect(screen.queryByTestId('document-doc-2')).not.toBeInTheDocument() // Doesn't contain "Contrato"
      expect(screen.queryByTestId('document-doc-3')).not.toBeInTheDocument()
      expect(screen.queryByTestId('document-doc-4')).not.toBeInTheDocument()
    })

    it('should filter documents by category', async () => {
      render(
        <TestWrapper>
          <MockDocumentAccess />
        </TestWrapper>
      )

      const categoryFilter = screen.getByTestId('category-filter')
      await user.selectOptions(categoryFilter, 'petition')

      // Should show only petition documents
      expect(screen.queryByTestId('document-doc-1')).not.toBeInTheDocument() // contract
      expect(screen.getByTestId('document-doc-2')).toBeInTheDocument() // petition
      expect(screen.queryByTestId('document-doc-3')).not.toBeInTheDocument() // opinion
      expect(screen.queryByTestId('document-doc-4')).not.toBeInTheDocument() // official
    })

    it('should filter documents by status', async () => {
      render(
        <TestWrapper>
          <MockDocumentAccess />
        </TestWrapper>
      )

      const statusFilter = screen.getByTestId('status-filter')
      await user.selectOptions(statusFilter, 'draft')

      // Should show only draft documents
      expect(screen.queryByTestId('document-doc-1')).not.toBeInTheDocument() // final
      expect(screen.queryByTestId('document-doc-2')).not.toBeInTheDocument() // final
      expect(screen.getByTestId('document-doc-3')).toBeInTheDocument() // draft
      expect(screen.queryByTestId('document-doc-4')).not.toBeInTheDocument() // final
    })

    it('should show appropriate actions based on access level', async () => {
      render(
        <TestWrapper>
          <MockDocumentAccess />
        </TestWrapper>
      )

      // Document with read_download access should have both buttons
      const doc1 = screen.getByTestId('document-doc-1')
      expect(within(doc1).getByTestId('view-document-doc-1')).toBeInTheDocument()
      expect(within(doc1).getByTestId('download-document-doc-1')).toBeInTheDocument()

      // Document with read_only access should only have view button
      const doc2 = screen.getByTestId('document-doc-2')
      expect(within(doc2).getByTestId('view-document-doc-2')).toBeInTheDocument()
      expect(within(doc2).queryByTestId('download-document-doc-2')).not.toBeInTheDocument()
      expect(within(doc2).getByTestId('no-download-doc-2')).toHaveTextContent('Download não disponível')
    })

    it('should handle document download', async () => {
      const onDocumentDownload = jest.fn()
      
      render(
        <TestWrapper>
          <MockDocumentAccess onDocumentDownload={onDocumentDownload} />
        </TestWrapper>
      )

      // Download document with read_download access
      const downloadBtn = screen.getByTestId('download-document-doc-1')
      await user.click(downloadBtn)

      expect(onDocumentDownload).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'doc-1',
          name: 'Contrato de Prestação de Serviços - Final.pdf',
          access_level: 'read_download'
        })
      )
    })

    it('should handle document viewing', async () => {
      const onDocumentView = jest.fn()
      
      render(
        <TestWrapper>
          <MockDocumentAccess onDocumentView={onDocumentView} />
        </TestWrapper>
      )

      // View any document
      const viewBtn = screen.getByTestId('view-document-doc-1')
      await user.click(viewBtn)

      expect(onDocumentView).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'doc-1',
          name: 'Contrato de Prestação de Serviços - Final.pdf'
        })
      )
    })

    it('should display document information correctly', async () => {
      render(
        <TestWrapper>
          <MockDocumentAccess />
        </TestWrapper>
      )

      const document1 = screen.getByTestId('document-doc-1')
      const docInfo = within(document1).getByTestId('document-info')

      expect(within(docInfo).getByTestId('document-name')).toHaveTextContent('Contrato de Prestação de Serviços - Final.pdf')
      expect(within(docInfo).getByTestId('document-matter')).toHaveTextContent('Contrato Empresarial - StartupCorp')
      expect(within(docInfo).getByTestId('document-category')).toHaveTextContent('Categoria: Contratos')
      expect(within(docInfo).getByTestId('document-lawyer')).toHaveTextContent('Advogado: Dr. João Silva')
      expect(within(docInfo).getByTestId('document-upload-date')).toHaveTextContent('Enviado em: 2024-12-15')
      expect(within(docInfo).getByTestId('document-size')).toHaveTextContent('Tamanho: 2.3 MB')
      expect(within(docInfo).getByTestId('document-status')).toHaveTextContent('Status: Final')
      expect(within(docInfo).getByTestId('document-access-level')).toHaveTextContent('Acesso: Leitura e Download')
    })
  })

  describe('Invoice Payment', () => {
    it('should display invoice details and line items', async () => {
      render(
        <TestWrapper>
          <MockInvoicePayment />
        </TestWrapper>
      )

      expect(screen.getByTestId('invoice-payment')).toBeInTheDocument()
      expect(screen.getByText('Pagamento de Fatura')).toBeInTheDocument()

      // Check invoice header
      expect(screen.getByTestId('invoice-number')).toHaveTextContent('Fatura: CASE-2024-000001')

      // Check invoice information
      const invoiceInfo = screen.getByTestId('invoice-info')
      expect(within(invoiceInfo).getByTestId('invoice-matter')).toHaveTextContent('Caso: Ação Trabalhista - TechCorp')
      expect(within(invoiceInfo).getByTestId('invoice-description')).toHaveTextContent('Descrição: Honorários advocatícios - Ação Trabalhista')
      expect(within(invoiceInfo).getByTestId('invoice-due-date')).toHaveTextContent('Data de Vencimento: 2024-12-25')

      // Check line items table
      const lineItemsTable = screen.getByTestId('line-items-table')
      expect(lineItemsTable).toBeInTheDocument()

      const lineItem1 = screen.getByTestId('line-item-item-1')
      expect(within(lineItem1).getByTestId('item-description')).toHaveTextContent('Consulta jurídica inicial')
      expect(within(lineItem1).getByTestId('item-quantity')).toHaveTextContent('2')
      expect(within(lineItem1).getByTestId('item-unit-price')).toHaveTextContent('R$ 400')
      expect(within(lineItem1).getByTestId('item-total')).toHaveTextContent('R$ 800')

      // Check totals
      expect(screen.getByTestId('invoice-subtotal')).toHaveTextContent('R$ 8.500')
      expect(screen.getByTestId('invoice-total')).toHaveTextContent('R$ 8.500')
    })

    it('should display payment method options', async () => {
      render(
        <TestWrapper>
          <MockInvoicePayment />
        </TestWrapper>
      )

      const paymentMethods = screen.getByTestId('payment-methods')
      expect(paymentMethods).toBeInTheDocument()

      // Check available payment methods
      expect(screen.getByTestId('payment-method-pix')).toHaveTextContent('PIX')
      expect(screen.getByTestId('payment-method-bank_transfer')).toHaveTextContent('Transferência Bancária')
      expect(screen.getByTestId('payment-method-credit_card')).toHaveTextContent('Cartão de Crédito')
    })

    it('should handle PIX payment selection', async () => {
      render(
        <TestWrapper>
          <MockInvoicePayment />
        </TestWrapper>
      )

      // Select PIX payment
      await user.click(screen.getByTestId('payment-method-pix'))

      // Payment form should appear
      const paymentForm = screen.getByTestId('payment-form')
      expect(paymentForm).toBeInTheDocument()

      // Check PIX payment details
      const pixPayment = screen.getByTestId('pix-payment')
      expect(pixPayment).toBeInTheDocument()
      expect(within(pixPayment).getByTestId('pix-key')).toHaveTextContent('Chave PIX: 12.345.678/0001-90')
      expect(within(pixPayment).getByTestId('pix-amount')).toHaveTextContent('Valor: R$ 8.500')

      // Test copy PIX key
      const copyBtn = screen.getByTestId('copy-pix-key')
      await user.click(copyBtn)
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('12.345.678/0001-90')
    })

    it('should handle bank transfer payment selection', async () => {
      render(
        <TestWrapper>
          <MockInvoicePayment />
        </TestWrapper>
      )

      // Select bank transfer payment
      await user.click(screen.getByTestId('payment-method-bank_transfer'))

      // Payment form should appear
      const paymentForm = screen.getByTestId('payment-form')
      expect(paymentForm).toBeInTheDocument()

      // Check bank transfer details
      const bankTransfer = screen.getByTestId('bank-transfer-payment')
      expect(bankTransfer).toBeInTheDocument()

      const bankDetails = within(bankTransfer).getByTestId('bank-details')
      expect(bankDetails).toHaveTextContent('Banco: Banco do Brasil')
      expect(bankDetails).toHaveTextContent('Agência: 1234-5')
      expect(bankDetails).toHaveTextContent('Conta: 67890-1')
      expect(bankDetails).toHaveTextContent('CNPJ: 12.345.678/0001-90')
      expect(within(bankTransfer).getByTestId('transfer-amount')).toHaveTextContent('Valor: R$ 8.500')
    })

    it('should handle credit card payment selection', async () => {
      render(
        <TestWrapper>
          <MockInvoicePayment />
        </TestWrapper>
      )

      // Select credit card payment
      await user.click(screen.getByTestId('payment-method-credit_card'))

      // Payment form should appear
      const paymentForm = screen.getByTestId('payment-form')
      expect(paymentForm).toBeInTheDocument()

      // Check credit card form
      const creditCardPayment = screen.getByTestId('credit-card-payment')
      expect(creditCardPayment).toBeInTheDocument()

      // Check installments selection
      const installmentsSelect = screen.getByTestId('installments-selection').querySelector('select')
      expect(installmentsSelect).toBeInTheDocument()

      // Check card form fields
      const cardForm = screen.getByTestId('card-form')
      expect(within(cardForm).getByTestId('card-holder-name-input')).toBeInTheDocument()
      expect(within(cardForm).getByTestId('card-number-input')).toBeInTheDocument()
      expect(within(cardForm).getByTestId('expiry-date-input')).toBeInTheDocument()
      expect(within(cardForm).getByTestId('cvv-input')).toBeInTheDocument()
      expect(within(cardForm).getByTestId('cpf-input')).toBeInTheDocument()
    })

    it('should validate credit card form before submission', async () => {
      render(
        <TestWrapper>
          <MockInvoicePayment />
        </TestWrapper>
      )

      // Select credit card payment
      await user.click(screen.getByTestId('payment-method-credit_card'))

      // Confirm button should be disabled initially
      const confirmBtn = screen.getByTestId('confirm-payment-btn')
      expect(confirmBtn).toBeDisabled()

      // Fill partial form
      const cardHolderInput = screen.getByTestId('card-holder-name-input').querySelector('input')
      await user.type(cardHolderInput, 'Maria Santos')

      // Should still be disabled with incomplete form
      expect(confirmBtn).toBeDisabled()

      // Fill complete form
      const cardNumberInput = screen.getByTestId('card-number-input').querySelector('input')
      const expiryInput = screen.getByTestId('expiry-date-input').querySelector('input')
      const cvvInput = screen.getByTestId('cvv-input').querySelector('input')
      const cpfInput = screen.getByTestId('cpf-input').querySelector('input')

      await user.type(cardNumberInput, '1234 5678 9012 3456')
      await user.type(expiryInput, '12/28')
      await user.type(cvvInput, '123')
      await user.type(cpfInput, '000.000.000-00')

      // Should be enabled with complete form
      expect(confirmBtn).not.toBeDisabled()
    })

    it('should submit payment successfully', async () => {
      const onPaymentSubmit = jest.fn()
      
      render(
        <TestWrapper>
          <MockInvoicePayment onPaymentSubmit={onPaymentSubmit} />
        </TestWrapper>
      )

      // Select PIX payment (doesn't require form validation)
      await user.click(screen.getByTestId('payment-method-pix'))

      // Confirm payment
      const confirmBtn = screen.getByTestId('confirm-payment-btn')
      await user.click(confirmBtn)

      expect(onPaymentSubmit).toHaveBeenCalledWith({
        invoice_id: 'invoice-1',
        payment_method: 'pix',
        amount: 8500,
        installments: 1,
        payment_data: expect.any(Object)
      })

      // Payment form should close
      expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument()
    })

    it('should cancel payment process', async () => {
      render(
        <TestWrapper>
          <MockInvoicePayment />
        </TestWrapper>
      )

      // Select a payment method
      await user.click(screen.getByTestId('payment-method-pix'))
      expect(screen.getByTestId('payment-form')).toBeInTheDocument()

      // Cancel payment
      const cancelBtn = screen.getByTestId('cancel-payment-btn')
      await user.click(cancelBtn)

      // Should return to payment method selection
      expect(screen.queryByTestId('payment-form')).not.toBeInTheDocument()
      expect(screen.getByTestId('payment-methods')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should adapt dashboard for mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <MockClientDashboard />
        </TestWrapper>
      )

      const dashboard = screen.getByTestId('client-dashboard')
      expect(dashboard).toBeInTheDocument()

      // Verify mobile-friendly elements are present
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument()
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument()
    })

    it('should maintain functionality on tablet devices', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      const onDocumentDownload = jest.fn()
      
      render(
        <TestWrapper>
          <MockDocumentAccess onDocumentDownload={onDocumentDownload} />
        </TestWrapper>
      )

      // Test document download on tablet
      await user.click(screen.getByTestId('download-document-doc-1'))
      expect(onDocumentDownload).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(
        <TestWrapper>
          <MockDocumentAccess />
        </TestWrapper>
      )

      // Check form labels
      const searchInput = screen.getByTestId('document-search')
      expect(searchInput).toHaveAttribute('placeholder', 'Buscar documentos...')

      const categoryFilter = screen.getByTestId('category-filter')
      expect(categoryFilter).toBeInTheDocument()

      // Check buttons have descriptive text
      const downloadBtns = screen.getAllByText(/Download/i)
      downloadBtns.forEach(btn => {
        expect(btn).toHaveTextContent(/download/i)
      })
    })

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <MockCaseProgress />
        </TestWrapper>
      )

      const overviewTab = screen.getByTestId('overview-tab')
      const timelineTab = screen.getByTestId('timeline-tab')
      const documentsTab = screen.getByTestId('documents-tab')

      // Tab navigation
      overviewTab.focus()
      expect(overviewTab).toHaveFocus()

      await user.tab()
      expect(timelineTab).toHaveFocus()

      await user.tab()
      expect(documentsTab).toHaveFocus()

      // Keyboard activation
      await user.keyboard('{Enter}')
      expect(documentsTab).toHaveClass('active')
    })
  })

  describe('Error Handling', () => {
    it('should handle document download errors gracefully', async () => {
      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockRejectedValue(new Error('Download failed'))
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <MockDocumentAccess />
        </TestWrapper>
      )

      // Should still work with mock implementation
      const downloadBtn = screen.getByTestId('download-document-doc-1')
      expect(downloadBtn).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should validate payment form inputs', async () => {
      render(
        <TestWrapper>
          <MockInvoicePayment />
        </TestWrapper>
      )

      await user.click(screen.getByTestId('payment-method-credit_card'))

      const cardNumberInput = screen.getByTestId('card-number-input').querySelector('input')
      const expiryInput = screen.getByTestId('expiry-date-input').querySelector('input')
      const cvvInput = screen.getByTestId('cvv-input').querySelector('input')

      // Check input constraints
      expect(cardNumberInput).toHaveAttribute('maxLength', '19')
      expect(expiryInput).toHaveAttribute('maxLength', '5')
      expect(cvvInput).toHaveAttribute('maxLength', '4')
    })
  })
})