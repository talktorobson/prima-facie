'use client'

import { useState, useMemo } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useActivityLogs, useUsers } from '@/lib/queries/useAdmin'
import Link from 'next/link'
import { ArrowLeftIcon, ShieldCheckIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AdminSecurityPage() {
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const [entityFilter, setEntityFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')

  const { data: activityLogs, isLoading: logsLoading } = useActivityLogs(effectiveLawFirmId)
  const { data: users, isLoading: usersLoading } = useUsers(effectiveLawFirmId)

  const isLoading = logsLoading || usersLoading

  const entityTypes = useMemo(() => {
    const types = new Set((activityLogs ?? []).map((l) => l.entity_type))
    return Array.from(types).sort()
  }, [activityLogs])

  const filteredLogs = useMemo(() => {
    let result = activityLogs ?? []
    if (entityFilter) {
      result = result.filter((l) => l.entity_type === entityFilter)
    }
    if (userFilter) {
      result = result.filter((l) => l.user_id === userFilter)
    }
    return result
  }, [activityLogs, entityFilter, userFilter])

  const activeUsers = (users ?? []).filter((u) => u.status === 'active').length
  const totalLogins = (activityLogs ?? []).filter((l) => l.action === 'login').length

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
            <h1 className="text-2xl font-bold text-gray-900">Seguranca</h1>
            <p className="text-gray-600">Logs de acesso, auditoria e permissoes</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">{activeUsers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Logins</p>
                <p className="text-2xl font-semibold text-gray-900">{totalLogins}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
                <p className="text-2xl font-semibold text-gray-900">{(activityLogs ?? []).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="block w-48 rounded-md border-gray-300 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="">Todas as Entidades</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="block w-48 rounded-md border-gray-300 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="">Todos os Usuarios</option>
              {(users ?? []).map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Activity Log Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Log de Auditoria ({filteredLogs.length} eventos)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acao</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descricao</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quando</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const logUser = (log as Record<string, unknown>).users as { full_name?: string } | null
                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {logUser?.full_name ?? 'Sistema'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.entity_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {log.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredLogs.length === 0 && (
              <p className="text-sm text-gray-500 p-6 text-center">Nenhum evento encontrado.</p>
            )}
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}
