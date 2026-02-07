'use client'

import { SuperAdminOnly } from '@/components/auth/role-guard'
import { usePlatformFirms, usePlatformStats } from '@/lib/queries/usePlatform'
import Link from 'next/link'
import {
  BuildingOffice2Icon,
  UsersIcon,
  FolderIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

export default function PlatformPage() {
  const { data: firms, isLoading: firmsLoading, error: firmsError } = usePlatformFirms()
  const { data: stats, isLoading: statsLoading, error: statsError } = usePlatformStats()

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR')

  const loading = firmsLoading || statsLoading
  const error = firmsError || statsError

  return (
    <SuperAdminOnly
      fallback={
        <div className="text-center py-12">
          <p className="text-gray-500">Acesso restrito ao Super Admin.</p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Plataforma</h1>
          <p className="mt-2 text-gray-600">
            Visão geral de todos os escritórios na plataforma
          </p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex items-center justify-center min-h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">Erro ao carregar dados da plataforma</p>
            <p className="text-red-600 text-sm mt-1">{(error as Error).message}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <BuildingOffice2Icon className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Escritórios</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.totalFirms ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <UsersIcon className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Usuários</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.totalUsers ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <FolderIcon className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Processos</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats?.totalMatters ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Receita Total</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(stats?.totalRevenue ?? 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Firms Table */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Escritórios Cadastrados
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Escritório
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuários
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receita
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cadastro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {firms?.map((firm) => (
                      <tr
                        key={firm.id}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/platform/firms/${firm.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            {firm.name}
                          </Link>
                          {firm.legal_name && (
                            <p className="text-xs text-gray-500">{firm.legal_name}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                            {firm.plan_type || 'trial'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {firm.user_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {firm.matter_count}
                          {firm.active_matter_count > 0 && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({firm.active_matter_count} ativos)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(firm.total_revenue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              firm.subscription_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {firm.subscription_active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(firm.created_at)}
                        </td>
                      </tr>
                    ))}
                    {(!firms || firms.length === 0) && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          Nenhum escritório cadastrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </SuperAdminOnly>
  )
}
