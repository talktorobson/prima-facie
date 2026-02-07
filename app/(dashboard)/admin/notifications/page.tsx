'use client'

import { useState, useEffect } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useLawFirm, useUpdateLawFirm } from '@/lib/queries/useSettings'
import { useToast } from '@/components/ui/toast-provider'
import Link from 'next/link'
import { ArrowLeftIcon, BellIcon } from '@heroicons/react/24/outline'

interface NotificationSettings {
  email_new_matter: boolean
  email_deadline_reminder: boolean
  email_invoice_created: boolean
  email_payment_received: boolean
  email_new_message: boolean
  email_weekly_report: boolean
  reminder_days_before: number
}

const defaults: NotificationSettings = {
  email_new_matter: true,
  email_deadline_reminder: true,
  email_invoice_created: true,
  email_payment_received: true,
  email_new_message: true,
  email_weekly_report: false,
  reminder_days_before: 3,
}

export default function AdminNotificationsPage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const toast = useToast()
  const { data: lawFirm, isLoading } = useLawFirm(effectiveLawFirmId ?? undefined)
  const updateLawFirm = useUpdateLawFirm()

  const [settings, setSettings] = useState<NotificationSettings>(defaults)

  useEffect(() => {
    if (lawFirm?.features) {
      const features = lawFirm.features as Record<string, unknown>
      const notifs = (features.notifications ?? {}) as Record<string, unknown>
      setSettings({
        email_new_matter: (notifs.email_new_matter as boolean) ?? defaults.email_new_matter,
        email_deadline_reminder: (notifs.email_deadline_reminder as boolean) ?? defaults.email_deadline_reminder,
        email_invoice_created: (notifs.email_invoice_created as boolean) ?? defaults.email_invoice_created,
        email_payment_received: (notifs.email_payment_received as boolean) ?? defaults.email_payment_received,
        email_new_message: (notifs.email_new_message as boolean) ?? defaults.email_new_message,
        email_weekly_report: (notifs.email_weekly_report as boolean) ?? defaults.email_weekly_report,
        reminder_days_before: (notifs.reminder_days_before as number) ?? defaults.reminder_days_before,
      })
    }
  }, [lawFirm])

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    if (!effectiveLawFirmId) return

    const features = {
      ...((lawFirm?.features as Record<string, unknown>) || {}),
      notifications: settings,
    }

    updateLawFirm.mutate(
      { id: effectiveLawFirmId, updates: { features } },
      {
        onSuccess: () => toast.success('Configuracoes de notificacao salvas!'),
        onError: () => toast.error('Erro ao salvar configuracoes.'),
      }
    )
  }

  const checkboxCls = 'h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded'

  const notificationOptions: { key: keyof NotificationSettings; label: string; description: string }[] = [
    { key: 'email_new_matter', label: 'Novo Caso', description: 'Notificar quando um novo caso for criado' },
    { key: 'email_deadline_reminder', label: 'Lembrete de Prazo', description: 'Alertar sobre prazos proximos de vencer' },
    { key: 'email_invoice_created', label: 'Fatura Criada', description: 'Notificar quando uma nova fatura for emitida' },
    { key: 'email_payment_received', label: 'Pagamento Recebido', description: 'Alertar quando um pagamento for confirmado' },
    { key: 'email_new_message', label: 'Nova Mensagem', description: 'Notificar sobre novas mensagens de clientes' },
    { key: 'email_weekly_report', label: 'Relatorio Semanal', description: 'Enviar resumo semanal de atividades por email' },
  ]

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
            <h1 className="text-2xl font-bold text-gray-900">Notificacoes</h1>
            <p className="text-gray-600">Configurar alertas e comunicacoes automatizadas</p>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <BellIcon className="h-6 w-6 text-rose-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Notificacoes por Email</h2>
          </div>
          <div className="space-y-4">
            {notificationOptions.map((option) => (
              <div key={option.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[option.key] as boolean}
                    onChange={() => handleToggle(option.key)}
                    className={checkboxCls}
                  />
                </div>
                <div className="border-t border-gray-100 mt-4" />
              </div>
            ))}
          </div>
        </div>

        {/* Reminder Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuracao de Lembretes</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dias de antecedencia para lembretes de prazo
            </label>
            <select
              value={settings.reminder_days_before}
              onChange={(e) => setSettings((prev) => ({ ...prev, reminder_days_before: Number(e.target.value) }))}
              className="block w-48 rounded-md border-gray-300 text-sm focus:ring-primary focus:border-primary"
            >
              <option value={1}>1 dia</option>
              <option value={2}>2 dias</option>
              <option value={3}>3 dias</option>
              <option value={5}>5 dias</option>
              <option value={7}>7 dias</option>
              <option value={14}>14 dias</option>
            </select>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={updateLawFirm.isPending}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
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
