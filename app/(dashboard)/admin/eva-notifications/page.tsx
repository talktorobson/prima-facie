'use client'

import { useState, useEffect } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useLawFirm, useUpdateLawFirm } from '@/lib/queries/useSettings'
import { useToast } from '@/components/ui/toast-provider'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  SparklesIcon,
  BellIcon,
} from '@heroicons/react/24/outline'

interface NotificationSetting {
  key: string
  label: string
  description: string
  defaultEnabled: boolean
}

const NOTIFICATION_TYPES: NotificationSetting[] = [
  {
    key: 'matter_status_change',
    label: 'Mudanca de Status do Processo',
    description: 'Notifica o cliente quando o status de um processo e alterado.',
    defaultEnabled: true,
  },
  {
    key: 'new_document',
    label: 'Novo Documento Adicionado',
    description: 'Notifica o cliente quando um novo documento e adicionado ao processo.',
    defaultEnabled: true,
  },
  {
    key: 'upcoming_deadline',
    label: 'Prazo Proximo (3 dias)',
    description: 'Notifica o cliente quando ha um prazo ou audiencia nos proximos 3 dias.',
    defaultEnabled: true,
  },
  {
    key: 'invoice_created',
    label: 'Nova Fatura Emitida',
    description: 'Notifica o cliente quando uma nova fatura e emitida.',
    defaultEnabled: false,
  },
  {
    key: 'task_completed',
    label: 'Tarefa Concluida',
    description: 'Notifica o cliente quando uma tarefa relacionada ao processo e concluida.',
    defaultEnabled: false,
  },
]

export default function EvaNotificationsPage() {
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const toast = useToast()
  const { data: lawFirm, isLoading } = useLawFirm(effectiveLawFirmId ?? undefined)
  const updateLawFirm = useUpdateLawFirm()

  const [settings, setSettings] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (lawFirm?.features) {
      const features = lawFirm.features as Record<string, unknown>
      const saved = features.eva_notifications as Record<string, boolean> | undefined
      if (saved) {
        setSettings(saved)
      } else {
        // Initialize with defaults
        const defaults: Record<string, boolean> = {}
        NOTIFICATION_TYPES.forEach((nt) => { defaults[nt.key] = nt.defaultEnabled })
        setSettings(defaults)
      }
    }
  }, [lawFirm])

  const handleToggle = (key: string) => {
    const updated = { ...settings, [key]: !settings[key] }
    setSettings(updated)
    saveSettings(updated)
  }

  const saveSettings = (updated: Record<string, boolean>) => {
    if (!effectiveLawFirmId) return

    const features = {
      ...((lawFirm?.features as Record<string, unknown>) || {}),
      eva_notifications: updated,
    }

    updateLawFirm.mutate(
      { id: effectiveLawFirmId, updates: { features } },
      {
        onSuccess: () => toast.success('Configuracoes salvas!'),
        onError: () => toast.error('Erro ao salvar configuracoes.'),
      }
    )
  }

  const handleEnableAll = () => {
    const all: Record<string, boolean> = {}
    NOTIFICATION_TYPES.forEach((nt) => { all[nt.key] = true })
    setSettings(all)
    saveSettings(all)
  }

  const handleResetDefaults = () => {
    const defaults: Record<string, boolean> = {}
    NOTIFICATION_TYPES.forEach((nt) => { defaults[nt.key] = nt.defaultEnabled })
    setSettings(defaults)
    saveSettings(defaults)
  }

  const enabledCount = Object.values(settings).filter(Boolean).length

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-primary" />
                EVA Notificacoes
              </h1>
              <p className="text-gray-600">
                Configure as notificacoes automaticas que a EVA envia aos clientes.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetDefaults}
              disabled={updateLawFirm.isPending}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Restaurar Padrao
            </button>
            <button
              onClick={handleEnableAll}
              disabled={updateLawFirm.isPending}
              className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              Ativar Todos
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <SparklesIcon className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-700">
                Quando habilitadas, a EVA gera mensagens personalizadas e naturais para cada evento
                e as envia automaticamente na conversa do cliente com o escritorio.
                O cliente ve a mensagem como enviada pelo advogado responsavel.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {enabledCount} de {NOTIFICATION_TYPES.length} tipos de notificacao ativos.
              </p>
            </div>
          </div>
        </div>

        {/* Notification types */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="mt-3 text-gray-500">Carregando configuracoes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {NOTIFICATION_TYPES.map((nt) => {
              const isEnabled = settings[nt.key] ?? nt.defaultEnabled
              return (
                <div
                  key={nt.key}
                  className={`bg-white rounded-lg border p-5 transition-colors ${
                    isEnabled ? 'border-primary/30' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        isEnabled ? 'bg-primary/10' : 'bg-gray-100'
                      }`}>
                        <BellIcon className={`h-5 w-5 ${
                          isEnabled ? 'text-primary' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{nt.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{nt.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggle(nt.key)}
                      disabled={updateLawFirm.isPending}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 ${
                        isEnabled ? 'bg-primary' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AdminOnly>
  )
}
