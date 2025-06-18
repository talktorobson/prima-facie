// =====================================================
// Prima Facie - Dashboard Page
// Main dashboard with overview stats and recent activity
// =====================================================

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { StaffOnly, ClientOnly } from '@/components/auth/role-guard'
import { clientService, type ClientStats } from '@/lib/clients/client-service'
import { matterService, type MatterStats } from '@/lib/matters/matter-service'
import { 
  FolderIcon, 
  UsersIcon, 
  DollarSignIcon, 
  ClockIcon,
  TrendingUpIcon,
  AlertTriangleIcon
} from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

function StatCard({ title, value, icon: Icon, change, changeType = 'neutral' }: StatCardProps) {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
              {change && (
                <div className={`ml-2 flex items-baseline text-sm ${changeColors[changeType]}`}>
                  <TrendingUpIcon className="self-center flex-shrink-0 h-4 w-4" />
                  <span className="ml-1">{change}</span>
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  )
}

interface RecentItemProps {
  title: string
  subtitle: string
  time: string
  type: 'matter' | 'client' | 'task' | 'document'
}

function RecentItem({ title, subtitle, time, type }: RecentItemProps) {
  const typeColors = {
    matter: 'bg-blue-100 text-blue-800',
    client: 'bg-green-100 text-green-800', 
    task: 'bg-yellow-100 text-yellow-800',
    document: 'bg-purple-100 text-purple-800'
  }

  return (
    <div className="flex items-center py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {title}
        </p>
        <p className="text-sm text-gray-500 truncate">
          {subtitle}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[type]}`}>
          {type}
        </span>
        <span className="text-xs text-gray-400">
          {time}
        </span>
      </div>
    </div>
  )
}

interface DashboardStats {
  clientStats: ClientStats | null
  matterStats: MatterStats | null
  recentActivity: any[]
  upcomingTasks: any[]
}

export default function DashboardPage() {
  const { profile } = useAuthContext()
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    clientStats: null,
    matterStats: null,
    recentActivity: [],
    upcomingTasks: []
  })

  useEffect(() => {
    if (profile?.law_firm_id) {
      fetchDashboardData()
    }
  }, [profile?.law_firm_id])

  const fetchDashboardData = async () => {
    if (!profile?.law_firm_id) return

    try {
      setLoading(true)
      
      // Fetch real statistics from database
      const [clientStats, matterStats] = await Promise.all([
        clientService.getClientStats(profile.law_firm_id),
        matterService.getMatterStats(profile.law_firm_id)
      ])

      // TODO: Fetch recent activity and upcoming tasks
      // For now, using sample data until those services are implemented
      const sampleRecentActivity = [
        {
          title: "Novo caso: Revisão Contratual",
          subtitle: "Cliente: Empresa ABC Ltda",
          time: "2h atrás",
          type: "matter" as const
        },
        {
          title: "Documento enviado",
          subtitle: "Contrato revisado.pdf",
          time: "4h atrás",
          type: "document" as const
        },
        {
          title: "Cliente cadastrado",
          subtitle: "João Silva Santos",
          time: "1 dia atrás",
          type: "client" as const
        }
      ]

      const sampleUpcomingTasks = [
        {
          title: "Audiência de Conciliação",
          subtitle: "Caso: Indenização por Danos Morais",
          time: "Amanhã 14:00",
          color: "yellow"
        },
        {
          title: "Entrega de Petição",
          subtitle: "Caso: Reclamatória Trabalhista",
          time: "15 Nov",
          color: "blue"
        }
      ]

      setStats({
        clientStats,
        matterStats,
        recentActivity: sampleRecentActivity,
        upcomingTasks: sampleUpcomingTasks
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Keep default empty state on error
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (!profile) {
    return <div>Carregando...</div>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {profile.first_name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Aqui está o resumo das suas atividades no {profile.law_firm?.name}
        </p>
      </div>

      {/* Stats Grid - Staff Only */}
      <StaffOnly>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Casos Ativos"
            value={stats.matterStats?.active_matters || 0}
            icon={FolderIcon}
            change="+12%"
            changeType="positive"
          />
          <StatCard
            title="Clientes"
            value={stats.clientStats?.total_clients || 0}
            icon={UsersIcon}
            change="+3%"
            changeType="positive"
          />
          <StatCard
            title="Receita do Mês"
            value={stats.matterStats?.total_billed ? formatCurrency(stats.matterStats.total_billed) : "R$ 0"}
            icon={DollarSignIcon}
            change="+8%"
            changeType="positive"
          />
          <StatCard
            title="Casos Totais"
            value={stats.matterStats?.total_matters || 0}
            icon={ClockIcon}
            change={stats.matterStats?.closed_matters ? `${Math.round((stats.matterStats.closed_matters / stats.matterStats.total_matters) * 100)}% concluídos` : ""}
            changeType="neutral"
          />
        </div>
      </StaffOnly>

      {/* Client Stats */}
      <ClientOnly>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Meus Casos"
            value={stats.matterStats?.active_matters || 0}
            icon={FolderIcon}
          />
          <StatCard
            title="Casos Encerrados"
            value={stats.matterStats?.closed_matters || 0}
            icon={ClockIcon}
          />
          <StatCard
            title="Total de Casos"
            value={stats.matterStats?.total_matters || 0}
            icon={AlertTriangleIcon}
          />
        </div>
      </ClientOnly>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Atividade Recente
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-1">
              <RecentItem
                title="Novo caso: Revisão Contratual"
                subtitle="Cliente: Empresa ABC Ltda"
                time="2h atrás"
                type="matter"
              />
              <RecentItem
                title="Documento enviado"
                subtitle="Contrato revisado.pdf"
                time="4h atrás"
                type="document"
              />
              <RecentItem
                title="Cliente cadastrado"
                subtitle="João Silva Santos"
                time="1 dia atrás"
                type="client"
              />
              <RecentItem
                title="Tarefa concluída"
                subtitle="Análise de viabilidade"
                time="2 dias atrás"
                type="task"
              />
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Próximas Tarefas
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Audiência de Conciliação
                  </p>
                  <p className="text-xs text-gray-500">
                    Caso: Indenização por Danos Morais
                  </p>
                </div>
                <span className="text-xs text-yellow-700 font-medium">
                  Amanhã 14:00
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Entrega de Petição
                  </p>
                  <p className="text-xs text-gray-500">
                    Caso: Reclamatória Trabalhista
                  </p>
                </div>
                <span className="text-xs text-blue-700 font-medium">
                  15 Nov
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Reunião com Cliente
                  </p>
                  <p className="text-xs text-gray-500">
                    Maria Silva - Consultoria
                  </p>
                </div>
                <span className="text-xs text-green-700 font-medium">
                  18 Nov 10:00
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Ações Rápidas
          </h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StaffOnly>
              <Link
                href="/matters/new"
                className="flex flex-col items-center p-4 text-center bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors group"
              >
                <FolderIcon className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-900">Novo Caso</span>
              </Link>
              
              <Link
                href="/clients/new"
                className="flex flex-col items-center p-4 text-center bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <UsersIcon className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-gray-900">Novo Cliente</span>
              </Link>
            </StaffOnly>
            
            <Link
              href="/billing/time-tracking"
              className="flex flex-col items-center p-4 text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
            >
              <ClockIcon className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900">Registrar Horas</span>
            </Link>
            
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex flex-col items-center p-4 text-center bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
            >
              <AlertTriangleIcon className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-gray-900">Nova Tarefa</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Nova Tarefa</h3>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const title = formData.get('title') as string
                const description = formData.get('description') as string
                
                // TODO: Implement actual task creation
                console.log('Creating task:', { title, description })
                alert('Tarefa criada com sucesso!')
                setShowTaskModal(false)
              }}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Título da Tarefa
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ex: Revisar contrato..."
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Detalhes da tarefa..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    Criar Tarefa
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}