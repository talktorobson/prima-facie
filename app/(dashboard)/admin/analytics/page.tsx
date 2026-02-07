'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useUsers, useActivityLogs } from '@/lib/queries/useAdmin'
import { useMatters } from '@/lib/queries/useMatters'
import { useInvoices } from '@/lib/queries/useInvoices'
import Link from 'next/link'
import { ArrowLeftIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { useMemo } from 'react'

export default function AdminAnalyticsPage() {
  const { profile } = useAuthContext()
  const { data: users, isLoading: usersLoading } = useUsers(profile?.law_firm_id)
  const { data: matters, isLoading: mattersLoading } = useMatters()
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(profile?.law_firm_id)
  const { data: activityLogs, isLoading: logsLoading } = useActivityLogs(profile?.law_firm_id)

  const isLoading = usersLoading || mattersLoading || invoicesLoading || logsLoading

  const stats = useMemo(() => {
    const mattersByStatus = (matters ?? []).reduce<Record<string, number>>((acc, m) => {
      acc[m.status] = (acc[m.status] || 0) + 1
      return acc
    }, {})

    const usersByType = (users ?? []).reduce<Record<string, number>>((acc, u) => {
      acc[u.user_type] = (acc[u.user_type] || 0) + 1
      return acc
    }, {})

    const totalRevenue = (invoices ?? [])
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total_amount ?? 0), 0)

    const outstandingRevenue = (invoices ?? [])
      .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + (i.outstanding_amount ?? 0), 0)

    return { mattersByStatus, usersByType, totalRevenue, outstandingRevenue }
  }, [matters, users, invoices])

  const matterStatusLabels: Record<string, string> = {
    active: 'Ativos',
    closed: 'Encerrados',
    on_hold: 'Suspensos',
    settled: 'Acordos',
    dismissed: 'Arquivados',
  }

  const userTypeLabels: Record<string, string> = {
    admin: 'Administradores',
    lawyer: 'Advogados',
    staff: 'Funcionarios',
    client: 'Clientes',
  }

  const matterStatusColors: Record<string, string> = {
    active: 'bg-green-500',
    closed: 'bg-gray-400',
    on_hold: 'bg-yellow-500',
    settled: 'bg-blue-500',
    dismissed: 'bg-gray-300',
  }

  const maxMatterCount = Math.max(...Object.values(stats.mattersByStatus), 1)

  if (isLoading) {
    return (
      <AdminOnly>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminOnly>
    )
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5 mr-1" />Voltar
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analiticos</h1>
            <p className="text-gray-600">Estatisticas de uso e relatorios administrativos</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Total de Casos</p>
            <p className="text-3xl font-bold text-gray-900">{(matters ?? []).length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Total de Usuarios</p>
            <p className="text-3xl font-bold text-gray-900">{(users ?? []).length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">Receita Recebida</p>
            <p className="text-3xl font-bold text-green-600">
              R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm font-medium text-gray-600">A Receber</p>
            <p className="text-3xl font-bold text-amber-600">
              R$ {stats.outstandingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Matters by Status */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <ChartBarIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Casos por Status</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(stats.mattersByStatus).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{matterStatusLabels[status] ?? status}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${matterStatusColors[status] ?? 'bg-gray-400'}`}
                      style={{ width: `${(count / maxMatterCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(stats.mattersByStatus).length === 0 && (
                <p className="text-sm text-gray-500">Nenhum caso registrado.</p>
              )}
            </div>
          </div>

          {/* Users by Type */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Usuarios por Tipo</h2>
            <div className="space-y-4">
              {Object.entries(stats.usersByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{userTypeLabels[type] ?? type}</span>
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    {count}
                  </span>
                </div>
              ))}
              {Object.keys(stats.usersByType).length === 0 && (
                <p className="text-sm text-gray-500">Nenhum usuario registrado.</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Ultimas Atividades</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acao</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(activityLogs ?? []).slice(0, 10).map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.description || log.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.entity_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(activityLogs ?? []).length === 0 && (
              <p className="text-sm text-gray-500 p-6">Nenhuma atividade registrada.</p>
            )}
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}
