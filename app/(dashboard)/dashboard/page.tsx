// =====================================================
// Prima Facie - Dashboard Page
// Main dashboard with overview stats and recent activity
// =====================================================

'use client'

import { useAuthContext } from '@/lib/providers/auth-provider'
import { StaffOnly, ClientOnly } from '@/components/auth/role-guard'
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

export default function DashboardPage() {
  const { profile } = useAuthContext()

  if (!profile) {
    return <div>Carregando...</div>
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
            value={23}
            icon={FolderIcon}
            change="+12%"
            changeType="positive"
          />
          <StatCard
            title="Clientes"
            value={156}
            icon={UsersIcon}
            change="+3%"
            changeType="positive"
          />
          <StatCard
            title="Receita do Mês"
            value="R$ 85.2k"
            icon={DollarSignIcon}
            change="+8%"
            changeType="positive"
          />
          <StatCard
            title="Horas Trabalhadas"
            value={164}
            icon={ClockIcon}
            change="-2%"
            changeType="negative"
          />
        </div>
      </StaffOnly>

      {/* Client Stats */}
      <ClientOnly>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Meus Casos"
            value={3}
            icon={FolderIcon}
          />
          <StatCard
            title="Tarefas Pendentes"
            value={7}
            icon={ClockIcon}
          />
          <StatCard
            title="Próxima Audiência"
            value="15 Nov"
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
              <button className="flex flex-col items-center p-4 text-center bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                <FolderIcon className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-medium text-gray-900">Novo Caso</span>
              </button>
              
              <button className="flex flex-col items-center p-4 text-center bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <UsersIcon className="w-8 h-8 text-green-600 mb-2" />
                <span className="text-sm font-medium text-gray-900">Novo Cliente</span>
              </button>
            </StaffOnly>
            
            <button className="flex flex-col items-center p-4 text-center bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <ClockIcon className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Registrar Horas</span>
            </button>
            
            <button className="flex flex-col items-center p-4 text-center bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <AlertTriangleIcon className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Nova Tarefa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}