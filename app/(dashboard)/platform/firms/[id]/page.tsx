'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { SuperAdminOnly } from '@/components/auth/role-guard'
import { usePlatformFirmDetail, usePlatformFirmUsers } from '@/lib/queries/usePlatform'
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  UsersIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline'

export default function PlatformFirmDetailPage() {
  const params = useParams()
  const firmId = params.id as string

  const { data: firm, isLoading: firmLoading } = usePlatformFirmDetail(firmId)
  const { data: users, isLoading: usersLoading } = usePlatformFirmUsers(firmId)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-BR')

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    lawyer: 'Advogado',
    staff: 'Equipe',
    client: 'Cliente',
  }

  const loading = firmLoading || usersLoading

  return (
    <SuperAdminOnly
      fallback={
        <div className="text-center py-12">
          <p className="text-gray-500">Acesso restrito ao Super Admin.</p>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href="/platform"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Voltar para Plataforma
        </Link>

        {loading ? (
          <div className="flex items-center justify-center min-h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !firm ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Escritório não encontrado.</p>
          </div>
        ) : (
          <>
            {/* Firm Info Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-blue-50">
                  <BuildingOffice2Icon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">{firm.name}</h1>
                  {firm.legal_name && (
                    <p className="text-gray-500">{firm.legal_name}</p>
                  )}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {firm.email}
                    </div>
                    {firm.phone && (
                      <div className="text-sm text-gray-600">
                        Tel: {firm.phone}
                      </div>
                    )}
                    {firm.website && (
                      <div className="flex items-center text-sm text-gray-600">
                        <GlobeAltIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {firm.website}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                      {firm.plan_type || 'trial'}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        firm.subscription_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {firm.subscription_active ? 'Ativo' : 'Inativo'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Cadastrado em {formatDate(firm.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            {firm.address_street && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Endereço</h2>
                <p className="text-sm text-gray-600">
                  {firm.address_street}
                  {firm.address_number && `, ${firm.address_number}`}
                  {firm.address_complement && ` - ${firm.address_complement}`}
                </p>
                <p className="text-sm text-gray-600">
                  {firm.address_neighborhood && `${firm.address_neighborhood} - `}
                  {firm.address_city}
                  {firm.address_state && `/${firm.address_state}`}
                  {firm.address_zipcode && ` - CEP: ${firm.address_zipcode}`}
                </p>
              </div>
            )}

            {/* Users List */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Usuários ({users?.length ?? 0})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Último Login
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users?.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.full_name || `${user.first_name} ${user.last_name}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {roleLabels[user.user_type] || user.user_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.status === 'active' ? 'Ativo' : user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login_at
                            ? formatDate(user.last_login_at)
                            : 'Nunca'}
                        </td>
                      </tr>
                    ))}
                    {(!users || users.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          Nenhum usuário cadastrado neste escritório.
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
