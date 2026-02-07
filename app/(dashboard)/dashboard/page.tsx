// =====================================================
// Prima Facie - Dashboard Page
// Main dashboard with overview stats and recent activity
// =====================================================

'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { StaffOnly, ClientOnly } from '@/components/auth/role-guard'
import { clientService, type ClientStats } from '@/lib/clients/client-service'
import { matterService, type MatterStats } from '@/lib/matters/matter-service'
import { useActivityLogs } from '@/lib/queries/useAdmin'
import { useTasks } from '@/lib/queries/useTasks'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  FolderIcon,
  UsersIcon,
  DollarSignIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  UserPlusIcon
} from 'lucide-react'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { useNewProspects } from '@/lib/queries/usePipeline'

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
  type: string
}

const entityTypeColors: Record<string, string> = {
  matter: 'bg-blue-100 text-blue-800',
  client: 'bg-green-100 text-green-800',
  task: 'bg-yellow-100 text-yellow-800',
  document: 'bg-purple-100 text-purple-800',
}

function RecentItem({ title, subtitle, time, type }: RecentItemProps) {
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
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${entityTypeColors[type] ?? 'bg-gray-100 text-gray-800'}`}>
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
}

export default function DashboardPage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    clientStats: null,
    matterStats: null,
  })

  const isSuperAdmin = profile?.user_type === 'super_admin'

  const { data: activityLogs, isLoading: logsLoading } = useActivityLogs(effectiveLawFirmId)
  const { data: tasks, isLoading: tasksLoading } = useTasks(effectiveLawFirmId)
  const { data: newProspects } = useNewProspects(effectiveLawFirmId)

  const recentLogs = useMemo(() => (activityLogs ?? []).slice(0, 5), [activityLogs])

  const upcomingTasks = useMemo(() => {
    if (!tasks) return []
    const now = new Date()
    return tasks
      .filter((t) => t.due_date && new Date(t.due_date) >= now && t.status !== 'completed')
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5)
  }, [tasks])

  useEffect(() => {
    if (effectiveLawFirmId) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [effectiveLawFirmId])

  const fetchDashboardData = async () => {
    if (!effectiveLawFirmId) return

    try {
      setLoading(true)

      const [clientStats, matterStats] = await Promise.all([
        clientService.getClientStats(effectiveLawFirmId!),
        matterService.getMatterStats(effectiveLawFirmId!)
      ])

      setStats({ clientStats, matterStats })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
          {profile.law_firm?.name
            ? `Aqui está o resumo das suas atividades no ${profile.law_firm.name}`
            : 'Painel geral da plataforma'}
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

      {/* New Prospects Alert - Staff Only */}
      <StaffOnly>
        {newProspects && newProspects.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <UserPlusIcon className="h-5 w-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-900">
                  Novos Prospects do Site
                </h3>
                <span className="inline-flex items-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {newProspects.length}
                </span>
              </div>
              <Link
                href="/pipeline"
                className="text-sm font-medium text-amber-700 hover:text-amber-900"
              >
                Ver no Pipeline
              </Link>
            </div>
            <div className="space-y-2">
              {newProspects.slice(0, 5).map((prospect) => (
                <div
                  key={prospect.id}
                  className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-amber-100"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {prospect.contact?.full_name || prospect.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {prospect.description}
                    </p>
                  </div>
                  <span className="ml-3 text-xs text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(prospect.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </StaffOnly>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Atividade Recente
            </h2>
          </div>
          <div className="px-6 py-4">
            {logsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : recentLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade recente.</p>
            ) : (
              <div className="space-y-1">
                {recentLogs.map((log) => (
                  <RecentItem
                    key={log.id}
                    title={log.description || `${log.action} em ${log.entity_type}`}
                    subtitle={log.entity_type}
                    time={formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    type={log.entity_type as 'matter' | 'client' | 'task' | 'document'}
                  />
                ))}
              </div>
            )}
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
            {tasksLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : upcomingTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Nenhuma tarefa próxima.</p>
            ) : (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(task as Record<string, unknown>).matter
                          ? `Caso: ${((task as Record<string, unknown>).matter as { title: string }).title}`
                          : task.description ?? ''}
                      </p>
                    </div>
                    <span className="text-xs text-blue-700 font-medium whitespace-nowrap ml-2">
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                        : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
      <CreateTaskDialog open={showTaskModal} onClose={() => setShowTaskModal(false)} />
    </div>
  )
}