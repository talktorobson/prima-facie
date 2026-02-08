'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useLawFirm, useUpdateLawFirm } from '@/lib/queries/useSettings'
import { useToast } from '@/components/ui/toast-provider'
import { useState, useEffect } from 'react'
import { ArrowLeftIcon, CogIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function SystemSettingsPage() {
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const toast = useToast()
  const { data: lawFirm, isLoading } = useLawFirm(effectiveLawFirmId ?? undefined)
  const updateLawFirm = useUpdateLawFirm()

  const [defaultTimezone, setDefaultTimezone] = useState('America/Sao_Paulo')
  const [defaultLanguage, setDefaultLanguage] = useState('pt-BR')
  const [defaultCurrency, setDefaultCurrency] = useState('BRL')
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY')
  const [autoBackup, setAutoBackup] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => {
    if (lawFirm?.features) {
      const features = lawFirm.features as Record<string, unknown>
      setDefaultTimezone((features.default_timezone as string) || 'America/Sao_Paulo')
      setDefaultLanguage((features.default_language as string) || 'pt-BR')
      setDefaultCurrency((features.default_currency as string) || 'BRL')
      setDateFormat((features.date_format as string) || 'DD/MM/YYYY')
      setAutoBackup((features.auto_backup as boolean) ?? true)
      setEmailNotifications((features.email_notifications as boolean) ?? true)
      setMaintenanceMode((features.maintenance_mode as boolean) ?? false)
    }
  }, [lawFirm])

  const handleSave = () => {
    if (!effectiveLawFirmId) return

    const features = {
      ...(lawFirm?.features as Record<string, unknown> || {}),
      default_timezone: defaultTimezone,
      default_language: defaultLanguage,
      default_currency: defaultCurrency,
      date_format: dateFormat,
      auto_backup: autoBackup,
      email_notifications: emailNotifications,
      maintenance_mode: maintenanceMode,
    }

    updateLawFirm.mutate(
      { id: effectiveLawFirmId, updates: { features } },
      {
        onSuccess: () => { toast.success('Configuracoes do sistema salvas com sucesso!') },
        onError: () => { toast.error('Erro ao salvar configuracoes do sistema.') },
      }
    )
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  const checkboxCls = 'h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded'

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
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5 mr-1" />Voltar para Admin
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuracoes do Sistema</h1>
            <p className="text-gray-600">Preferencias gerais, notificacoes e integracoes</p>
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <CogIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Preferencias Gerais</h2>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuso Horario</label>
                <select value={defaultTimezone} onChange={e => setDefaultTimezone(e.target.value)} className={inputCls}>
                  <option value="America/Sao_Paulo">Brasilia (GMT-3)</option>
                  <option value="America/Manaus">Manaus (GMT-4)</option>
                  <option value="America/Belem">Belem (GMT-3)</option>
                  <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
                  <option value="America/Cuiaba">Cuiaba (GMT-4)</option>
                  <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Idioma Padrao</label>
                <select value={defaultLanguage} onChange={e => setDefaultLanguage(e.target.value)} className={inputCls}>
                  <option value="pt-BR">Portugues (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Espanol</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Moeda</label>
                <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)} className={inputCls}>
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dolar (US$)</option>
                  <option value="EUR">Euro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Data</label>
                <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} className={inputCls}>
                  <option value="DD/MM/YYYY">DD/MM/AAAA</option>
                  <option value="MM/DD/YYYY">MM/DD/AAAA</option>
                  <option value="YYYY-MM-DD">AAAA-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* System Toggles */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Opcoes do Sistema</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Backup Automatico</p>
                <p className="text-xs text-gray-500">Realizar backup automatico dos dados diariamente</p>
              </div>
              <input type="checkbox" checked={autoBackup} onChange={e => setAutoBackup(e.target.checked)} className={checkboxCls} />
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Notificacoes por Email</p>
                <p className="text-xs text-gray-500">Enviar emails para eventos importantes do sistema</p>
              </div>
              <input type="checkbox" checked={emailNotifications} onChange={e => setEmailNotifications(e.target.checked)} className={checkboxCls} />
            </div>
            <div className="border-t border-gray-100" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Modo de Manutencao</p>
                <p className="text-xs text-gray-500">Ativar modo de manutencao (apenas admins terao acesso)</p>
              </div>
              <input type="checkbox" checked={maintenanceMode} onChange={e => setMaintenanceMode(e.target.checked)} className={checkboxCls} />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={updateLawFirm.isPending} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
            {updateLawFirm.isPending ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Salvando...</>
            ) : (
              'Salvar Configuracoes'
            )}
          </button>
        </div>
      </div>
    </AdminOnly>
  )
}
