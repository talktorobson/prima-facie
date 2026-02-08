'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useSupabase } from '@/components/providers'
import { useToast } from '@/components/ui/toast-provider'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BellIcon,
} from '@heroicons/react/24/outline'

export default function ClientSettingsPage() {
  const { profile } = useAuthContext()
  const supabase = useSupabase()
  const toast = useToast()

  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [matterUpdates, setMatterUpdates] = useState(true)
  const [billingAlerts, setBillingAlerts] = useState(true)

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '')
      setLastName(profile.last_name ?? '')
      setEmail(profile.email ?? '')
      setPhone((profile as unknown as Record<string, string>).phone ?? '')
    }
  }, [profile])

  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
        })
        .eq('id', profile.id)

      if (error) throw error
      toast.success('Configuracoes salvas com sucesso')
    } catch {
      toast.error('Erro ao salvar configuracoes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Gerencie seus dados pessoais e preferencias de notificacao
        </p>
      </div>

      {/* Personal Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Dados Pessoais</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <EnvelopeIcon className="h-4 w-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="block w-full rounded-md border-gray-300 bg-gray-50 text-gray-500 text-sm p-2 border cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-400">O email nao pode ser alterado</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <PhoneIcon className="h-4 w-4 inline mr-1" />
              Telefone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm p-2 border"
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <BellIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Preferencias de Notificacao</h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Notificacoes por email</span>
              <p className="text-xs text-gray-500">Receber atualizacoes por email</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Atualizacoes de processos</span>
              <p className="text-xs text-gray-500">Notificar sobre movimentacoes nos processos</p>
            </div>
            <input
              type="checkbox"
              checked={matterUpdates}
              onChange={(e) => setMatterUpdates(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Alertas financeiros</span>
              <p className="text-xs text-gray-500">Notificar sobre faturas e pagamentos</p>
            </div>
            <input
              type="checkbox"
              checked={billingAlerts}
              onChange={(e) => setBillingAlerts(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
        >
          {saving ? 'Salvando...' : 'Salvar Configuracoes'}
        </button>
      </div>
    </div>
  )
}
