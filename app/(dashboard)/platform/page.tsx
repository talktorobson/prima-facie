'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SuperAdminOnly } from '@/components/auth/role-guard'
import { usePlatformFirms, usePlatformStats, useUpdateFirm } from '@/lib/queries/usePlatform'
import { useFirmContext } from '@/lib/providers/firm-context'
import { CreateFirmDialog } from '@/components/platform/create-firm-dialog'
import { EditFirmDialog } from '@/components/platform/edit-firm-dialog'
import Link from 'next/link'
import {
  BuildingOffice2Icon,
  UsersIcon,
  FolderIcon,
  CurrencyDollarIcon,
  PlusIcon,
  PencilIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import type { LawFirm, PlatformLawFirmStats } from '@/types/database'

export default function PlatformPage() {
  const router = useRouter()
  const { data: firms, isLoading: firmsLoading, error: firmsError } = usePlatformFirms()
  const { data: stats, isLoading: statsLoading, error: statsError } = usePlatformStats()
  const { selectFirm } = useFirmContext()
  const updateFirm = useUpdateFirm()

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingFirm, setEditingFirm] = useState<LawFirm | null>(null)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR')

  const handleEnterFirm = (firm: PlatformLawFirmStats) => {
    selectFirm(firm.id, { ...firm } as unknown as LawFirm)
    router.push('/dashboard')
  }

  const handleToggleSubscription = async (firm: PlatformLawFirmStats) => {
    await updateFirm.mutateAsync({
      id: firm.id,
      updates: { subscription_active: !firm.subscription_active },
    })
  }

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
        <div className="flex items-start justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plataforma</h1>
            <p className="mt-2 text-gray-600">
              Visão geral de todos os escritórios na plataforma
            </p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Criar Escritório
          </button>
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
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {firms?.map((firm) => (
                      <tr
                        key={firm.id}
                        className="hover:bg-gray-50"
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
                          <button
                            onClick={() => handleToggleSubscription(firm)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${
                              firm.subscription_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {firm.subscription_active ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(firm.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingFirm({ ...firm } as unknown as LawFirm)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEnterFirm(firm)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100"
                              title="Acessar como Admin"
                            >
                              <ArrowRightOnRectangleIcon className="h-3.5 w-3.5" />
                              Acessar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!firms || firms.length === 0) && (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
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

      <CreateFirmDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      <EditFirmDialog
        open={!!editingFirm}
        firm={editingFirm}
        onClose={() => setEditingFirm(null)}
      />
    </SuperAdminOnly>
  )
}
