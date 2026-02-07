'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useUsers, useCreateUser, useUpdateUser, useDeactivateUser } from '@/lib/queries/useAdmin'
import { useToast } from '@/components/ui/toast-provider'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userManagementSchema, type UserManagementFormData } from '@/lib/schemas/settings-schemas'
import type { User } from '@/types/database'
import {
  UsersIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function UsersManagementPage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const { data: users, isLoading } = useUsers(effectiveLawFirmId)
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deactivateUser = useDeactivateUser()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserManagementFormData>({
    resolver: zodResolver(userManagementSchema),
  })

  const allUsers = users ?? []

  const filteredUsers = allUsers.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || user.user_type === filterType
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = { admin: 'Administrador', lawyer: 'Advogado', staff: 'Funcionario', client: 'Cliente', super_admin: 'Super Admin' }
    return labels[type] || type
  }

  const getUserTypeColor = (type: string) => {
    const colors: Record<string, string> = { admin: 'bg-red-100 text-red-800', lawyer: 'bg-blue-100 text-blue-800', staff: 'bg-green-100 text-green-800', client: 'bg-gray-100 text-gray-800' }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = { active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-800', suspended: 'bg-red-100 text-red-800', pending: 'bg-yellow-100 text-yellow-800' }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', suspended: 'Suspenso', pending: 'Pendente' }
    return labels[status] || status
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const openCreateModal = () => {
    setEditingUser(null)
    reset({ email: '', first_name: '', last_name: '', user_type: 'staff', oab_number: '', position: '', phone: '', status: 'active' })
    setShowModal(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    reset({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type as 'admin' | 'lawyer' | 'staff' | 'client',
      oab_number: user.oab_number || '',
      position: user.position || '',
      phone: user.phone || '',
      status: (user.status as 'active' | 'inactive' | 'suspended' | 'pending') || 'active',
    })
    setShowModal(true)
  }

  const onSubmit = (data: UserManagementFormData) => {
    if (editingUser) {
      updateUser.mutate(
        { id: editingUser.id, updates: { first_name: data.first_name, last_name: data.last_name, user_type: data.user_type, oab_number: data.oab_number, position: data.position, phone: data.phone, status: data.status } },
        {
          onSuccess: () => { toast.success('Usuario atualizado com sucesso!'); setShowModal(false) },
          onError: () => { toast.error('Erro ao atualizar usuario.') },
        }
      )
    } else {
      createUser.mutate(
        { email: data.email, first_name: data.first_name, last_name: data.last_name, user_type: data.user_type, oab_number: data.oab_number, position: data.position, phone: data.phone, law_firm_id: effectiveLawFirmId ?? null },
        {
          onSuccess: () => { toast.success('Usuario criado com sucesso!'); setShowModal(false) },
          onError: () => { toast.error('Erro ao criar usuario.') },
        }
      )
    }
  }

  const handleDeactivate = (userId: string) => {
    if (!confirm('Tem certeza que deseja desativar este usuario?')) return
    deactivateUser.mutate(userId, {
      onSuccess: () => { toast.success('Usuario desativado com sucesso!') },
      onError: () => { toast.error('Erro ao desativar usuario.') },
    })
  }

  const isMutating = createUser.isPending || updateUser.isPending

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
              <ArrowLeftIcon className="h-5 w-5 mr-1" />Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestao de Usuarios</h1>
              <p className="text-gray-600">Gerencie usuarios e permissoes do sistema</p>
            </div>
          </div>
          <button onClick={openCreateModal} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <UserPlusIcon className="h-5 w-5 mr-2" />Adicionar Usuario
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total de Usuarios</p>
                <p className="text-2xl font-semibold text-gray-900">{allUsers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Usuarios Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">{allUsers.filter(u => u.status === 'active').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <ShieldExclamationIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Advogados</p>
                <p className="text-2xl font-semibold text-gray-900">{allUsers.filter(u => u.user_type === 'lawyer').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-semibold text-gray-900">{allUsers.filter(u => u.user_type === 'client').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
            <div className="flex gap-4">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="all">Todos os tipos</option>
                <option value="admin">Administrador</option>
                <option value="lawyer">Advogado</option>
                <option value="staff">Funcionario</option>
                <option value="client">Cliente</option>
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="all">Todos os status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Usuarios ({filteredUsers.length})</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ultimo Acesso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acoes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
                          {getUserTypeLabel(user.user_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status || 'active')}`}>
                          {getStatusLabel(user.status || 'active')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.last_login_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => openEditModal(user)} className="text-blue-600 hover:text-blue-900" title="Editar">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeactivate(user.id)} className="text-red-600 hover:text-red-900" title="Desativar">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && filteredUsers.length === 0 && (
            <div className="px-6 py-12 text-center">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuario encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros ou adicionar um novo usuario.</p>
            </div>
          )}
        </div>

        {/* Create/Edit User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{editingUser ? 'Editar Usuario' : 'Adicionar Usuario'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input {...register('email')} type="email" disabled={!!editingUser} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
                  {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input {...register('first_name')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.first_name && <p className="text-sm text-red-600 mt-1">{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome *</label>
                    <input {...register('last_name')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {errors.last_name && <p className="text-sm text-red-600 mt-1">{errors.last_name.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario *</label>
                  <select {...register('user_type')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="admin">Administrador</option>
                    <option value="lawyer">Advogado</option>
                    <option value="staff">Funcionario</option>
                    <option value="client">Cliente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">OAB</label>
                  <input {...register('oab_number')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="OAB/SP 123456" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                  <input {...register('position')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input {...register('phone')} type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select {...register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="active">Ativo</option>
                      <option value="inactive">Inativo</option>
                      <option value="suspended">Suspenso</option>
                      <option value="pending">Pendente</option>
                    </select>
                  </div>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                  <button type="submit" disabled={isMutating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {isMutating ? 'Salvando...' : editingUser ? 'Atualizar' : 'Criar Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  )
}
