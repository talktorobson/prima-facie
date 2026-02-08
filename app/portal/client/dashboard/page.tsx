'use client'

import Link from 'next/link'
import { useMyMatters, useMyInvoices, useMyDocuments, useMyMessages } from '@/lib/queries/useClientPortal'
import { useAuthContext } from '@/lib/providers/auth-provider'
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

interface MatterRow {
  id: string
  title: string
  matter_number: string
  status: string
  priority: string
  next_court_date: string | null
  opened_date: string | null
  matter_type: { name: string } | null
  responsible_lawyer: { full_name: string } | null
}

interface InvoiceRow {
  id: string
  invoice_number: string
  title: string | null
  total_amount: number
  outstanding_amount: number | null
  status: string
  due_date: string
}

interface MessageRow {
  id: string
  content: string
  message_type: string
  sender_type: string
  status: string
  created_at: string
  read_at: string | null
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    active: 'text-green-700 bg-green-50 ring-green-600/20',
    ativo: 'text-green-700 bg-green-50 ring-green-600/20',
    on_hold: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
    aguardando_documentos: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
    closed: 'text-gray-700 bg-gray-50 ring-gray-600/20',
    finalizado: 'text-gray-700 bg-gray-50 ring-gray-600/20',
    settled: 'text-blue-700 bg-blue-50 ring-blue-600/20',
    dismissed: 'text-gray-700 bg-gray-50 ring-gray-600/20',
  }
  return colors[status] || 'text-green-700 bg-green-50 ring-green-600/20'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: 'Ativo',
    ativo: 'Ativo',
    on_hold: 'Suspenso',
    aguardando_documentos: 'Aguardando Documentos',
    closed: 'Encerrado',
    finalizado: 'Finalizado',
    settled: 'Acordo',
    dismissed: 'Arquivado',
  }
  return labels[status] || status
}

const getPriorityIcon = (priority: string) => {
  if (priority === 'alta' || priority === 'high') {
    return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
  }
  return <CheckCircleIcon className="h-4 w-4 text-green-500" />
}

export default function ClientDashboard() {
  const { profile } = useAuthContext()
  const { data: matters, isLoading: mattersLoading } = useMyMatters()
  const { data: invoices, isLoading: invoicesLoading } = useMyInvoices()
  const { data: documents, isLoading: docsLoading } = useMyDocuments()
  const { data: messages, isLoading: msgsLoading } = useMyMessages()

  const isLoading = mattersLoading || invoicesLoading || docsLoading || msgsLoading

  const matterList = (matters ?? []) as MatterRow[]
  const invoiceList = (invoices ?? []) as InvoiceRow[]
  const messageList = (messages ?? []) as MessageRow[]

  const activeMatters = matterList.filter(m => m.status === 'active' || m.status === 'ativo')
  const pendingInvoices = invoiceList.filter(
    inv => inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'viewed'
  )
  const pendingTotal = pendingInvoices.reduce(
    (sum, inv) => sum + (inv.outstanding_amount ?? inv.total_amount),
    0
  )
  const unreadMessages = messageList.filter(m => !m.read_at)

  const upcomingEvents = matterList
    .filter(m => m.next_court_date && new Date(m.next_court_date) >= new Date())
    .sort((a, b) => new Date(a.next_court_date!).getTime() - new Date(b.next_court_date!).getTime())

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo, {profile?.full_name ?? profile?.first_name ?? 'Cliente'}!
          </h1>
          <p className="mt-1 text-gray-600">
            Acompanhe seus processos, faturas e documentos.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Processos Ativos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {activeMatters.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Proximas Audiencias
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {upcomingEvents.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendente
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(pendingTotal)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Mensagens
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {unreadMessages.length > 0 ? `${unreadMessages.length} nova${unreadMessages.length > 1 ? 's' : ''}` : 'Nenhuma nova'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Matters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Meus Processos</h3>
              <Link
                href="/portal/client/matters"
                className="text-sm text-primary hover:text-primary/80 flex items-center"
              >
                Ver todos <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            {matterList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum processo encontrado.
              </p>
            ) : (
              <div className="space-y-4">
                {matterList.slice(0, 5).map((matter) => (
                  <div
                    key={matter.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {matter.title}
                          </h4>
                          {getPriorityIcon(matter.priority)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {matter.matter_number}
                          {matter.responsible_lawyer ? ` - ${matter.responsible_lawyer.full_name}` : ''}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(matter.status)}`}>
                            {getStatusLabel(matter.status)}
                          </span>
                          {matter.next_court_date && (
                            <span className="text-xs text-gray-500">
                              Audiencia: {formatDate(matter.next_court_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Faturas Recentes</h3>
          </div>
          <div className="p-6">
            {invoiceList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma fatura encontrada.
              </p>
            ) : (
              <div className="space-y-4">
                {invoiceList.slice(0, 5).map((inv) => (
                  <div
                    key={inv.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {inv.title ?? inv.invoice_number}
                      </h4>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                        inv.status === 'paid' ? 'text-green-700 bg-green-50 ring-green-600/20' :
                        inv.status === 'overdue' ? 'text-red-700 bg-red-50 ring-red-600/20' :
                        'text-blue-700 bg-blue-50 ring-blue-600/20'
                      }`}>
                        {inv.status === 'paid' ? 'Paga' :
                         inv.status === 'overdue' ? 'Vencida' :
                         inv.status === 'sent' ? 'Enviada' :
                         inv.status === 'viewed' ? 'Visualizada' : inv.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Vencimento: {formatDate(inv.due_date)}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(inv.total_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Hearings */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Proximas Audiencias</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.slice(0, 4).map((matter) => (
                <div
                  key={matter.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {matter.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {matter.matter_number}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {formatDate(matter.next_court_date!)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Acoes Rapidas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/portal/client/messages"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Enviar Mensagem</p>
                <p className="text-xs text-gray-500">Fale com seu advogado</p>
              </div>
            </Link>

            <Link
              href="/portal/client/billing"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CurrencyDollarIcon className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Ver Faturas</p>
                <p className="text-xs text-gray-500">Pagamentos e cobrancas</p>
              </div>
            </Link>

            <Link
              href="/portal/client/profile"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="h-6 w-6 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Enviar Documentos</p>
                <p className="text-xs text-gray-500">Upload de arquivos</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
