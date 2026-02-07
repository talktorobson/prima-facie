'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

// Mock data for client dashboard
const mockClientData = {
  client: {
    id: '1',
    name: 'João Silva Santos',
    client_number: 'CLI-2024-001',
    portal_last_access: '2024-01-20T10:30:00Z'
  },
  matters: [
    {
      id: '1',
      matter_number: 'PROC-2024-001',
      title: 'Ação Trabalhista - Rescisão Indevida',
      status: 'ativo',
      area_juridica: 'trabalhista',
      last_update: '2024-01-20',
      next_hearing: '2024-02-15',
      assigned_lawyer: 'Dra. Maria Silva Santos',
      priority: 'alta',
      client_summary: 'Processo em andamento. Aguardando resposta da empresa ré.'
    },
    {
      id: '2',
      matter_number: 'PROC-2024-012',
      title: 'Revisão Contratual - Compra e Venda',
      status: 'aguardando_documentos',
      area_juridica: 'civil',
      last_update: '2024-01-18',
      next_hearing: null,
      assigned_lawyer: 'Dr. João Santos Oliveira',
      priority: 'media',
      client_summary: 'Necessário envio de documentos complementares para prosseguimento.'
    }
  ],
  recentActivity: [
    {
      id: '1',
      type: 'document',
      title: 'Petição inicial protocolada',
      matter_id: '1',
      matter_title: 'Ação Trabalhista - Rescisão Indevida',
      date: '2024-01-20',
      description: 'Petição inicial foi protocolada no TRT-2'
    },
    {
      id: '2',
      type: 'message',
      title: 'Nova mensagem do advogado',
      matter_id: '2',
      matter_title: 'Revisão Contratual',
      date: '2024-01-19',
      description: 'Dr. João solicitou documentos complementares'
    },
    {
      id: '3',
      type: 'hearing',
      title: 'Audiência agendada',
      matter_id: '1',
      matter_title: 'Ação Trabalhista - Rescisão Indevida',
      date: '2024-01-18',
      description: 'Audiência de conciliação marcada para 15/02/2024'
    }
  ],
  upcomingEvents: [
    {
      id: '1',
      title: 'Audiência de Conciliação',
      matter_title: 'Ação Trabalhista - Rescisão Indevida',
      date: '2024-02-15',
      time: '14:00',
      location: 'TRT-2 - Sala 301',
      type: 'hearing'
    },
    {
      id: '2',
      title: 'Prazo para envio de documentos',
      matter_title: 'Revisão Contratual',
      date: '2024-01-25',
      time: '23:59',
      location: 'Portal do Cliente',
      type: 'deadline'
    }
  ],
  financialSummary: {
    total_billed: 2500.00,
    total_paid: 1800.00,
    pending_amount: 700.00,
    next_payment_due: '2024-02-01'
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    ativo: 'text-green-700 bg-green-50 ring-green-600/20',
    aguardando_documentos: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
    suspenso: 'text-red-700 bg-red-50 ring-red-600/20',
    finalizado: 'text-gray-700 bg-gray-50 ring-gray-600/20'
  }
  return colors[status as keyof typeof colors] || colors.ativo
}

const getStatusLabel = (status: string) => {
  const labels = {
    ativo: 'Ativo',
    aguardando_documentos: 'Aguardando Documentos',
    suspenso: 'Suspenso',
    finalizado: 'Finalizado'
  }
  return labels[status as keyof typeof labels] || status
}

const getPriorityIcon = (priority: string) => {
  if (priority === 'alta') {
    return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
  }
  return <CheckCircleIcon className="h-4 w-4 text-green-500" />
}

const getActivityIcon = (type: string) => {
  const icons = {
    document: DocumentTextIcon,
    message: ChatBubbleLeftRightIcon,
    hearing: CalendarIcon,
    deadline: ClockIcon
  }
  const IconComponent = icons[type as keyof typeof icons] || DocumentTextIcon
  return <IconComponent className="h-5 w-5 text-gray-400" />
}

export default function ClientDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState(mockClientData)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

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
            Bem-vindo, {data.client.name}!
          </h1>
          <p className="mt-1 text-gray-600">
            Último acesso: {formatDate(data.client.portal_last_access)}
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
                    {data.matters.filter(m => m.status === 'ativo').length}
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
                    Próximos Eventos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {data.upcomingEvents.length}
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
                    {formatCurrency(data.financialSummary.pending_amount)}
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
                    3 novas
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
            <div className="space-y-4">
              {data.matters.map((matter) => (
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
                        {matter.matter_number} • {matter.assigned_lawyer}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {matter.client_summary}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(matter.status)}`}>
                          {getStatusLabel(matter.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Atualizado em {formatDate(matter.last_update)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Atividades Recentes</h3>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {data.recentActivity.map((activity, index) => (
                  <li key={activity.id}>
                    <div className="relative pb-8">
                      {index !== data.recentActivity.length - 1 && (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {activity.matter_title}
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            {formatDate(activity.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Próximos Eventos</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {event.matter_title}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">
                        📅 {formatDate(event.date)} às {event.time}
                      </p>
                      <p className="text-sm text-gray-600">
                        📍 {event.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Ações Rápidas</h3>
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
                <p className="text-xs text-gray-500">Pagamentos e cobranças</p>
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