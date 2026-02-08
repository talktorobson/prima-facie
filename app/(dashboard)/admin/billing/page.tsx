'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useLawFirm } from '@/lib/queries/useSettings'
import { useInvoices } from '@/lib/queries/useInvoices'
import Link from 'next/link'
import { ArrowLeftIcon, CreditCardIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useMemo } from 'react'

const planLabels: Record<string, string> = {
  trial: 'Teste Gratuito',
  basic: 'Basico',
  professional: 'Profissional',
  enterprise: 'Empresarial',
}

const planLimits: Record<string, { users: number; matters: number; storage: string }> = {
  trial: { users: 2, matters: 10, storage: '1 GB' },
  basic: { users: 5, matters: 50, storage: '5 GB' },
  professional: { users: 20, matters: 500, storage: '50 GB' },
  enterprise: { users: 100, matters: 5000, storage: '500 GB' },
}

export default function AdminBillingPage() {
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const { data: lawFirm, isLoading: firmLoading } = useLawFirm(effectiveLawFirmId ?? undefined)
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(effectiveLawFirmId)

  const isLoading = firmLoading || invoicesLoading

  const currentPlan = lawFirm?.plan_type ?? 'professional'
  const limits = planLimits[currentPlan] ?? planLimits.professional

  const billingHistory = useMemo(() => {
    return (invoices ?? []).slice(0, 10)
  }, [invoices])

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    sent: 'Enviada',
    paid: 'Paga',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
    partially_paid: 'Parcial',
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-50 text-gray-700',
    sent: 'bg-blue-50 text-blue-700',
    paid: 'bg-green-50 text-green-700',
    overdue: 'bg-red-50 text-red-700',
    cancelled: 'bg-gray-50 text-gray-500',
    partially_paid: 'bg-yellow-50 text-yellow-700',
  }

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
            <ArrowLeftIcon className="h-5 w-5 mr-1" />Voltar para Admin
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faturamento</h1>
            <p className="text-gray-600">Plano de assinatura e historico de pagamentos</p>
          </div>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <CreditCardIcon className="h-6 w-6 text-amber-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Plano Atual</h2>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              lawFirm?.subscription_active !== false
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {lawFirm?.subscription_active !== false ? 'Ativo' : 'Inativo'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Plano</p>
              <p className="text-2xl font-bold text-gray-900">{planLabels[currentPlan] ?? currentPlan}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Limite de Usuarios</span>
                <span className="font-medium text-gray-900">{limits.users}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Limite de Casos</span>
                <span className="font-medium text-gray-900">{limits.matters}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Armazenamento</span>
                <span className="font-medium text-gray-900">{limits.storage}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Comparacao de Planos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Object.entries(planLabels).map(([key, label]) => {
              const pl = planLimits[key]
              const isCurrent = key === currentPlan
              return (
                <div
                  key={key}
                  className={`rounded-lg border-2 p-4 ${
                    isCurrent ? 'border-primary bg-primary/5' : 'border-gray-200'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{label}</h3>
                  {isCurrent && (
                    <span className="inline-flex items-center text-xs text-primary font-medium mb-2">
                      <CheckCircleIcon className="h-4 w-4 mr-1" /> Plano atual
                    </span>
                  )}
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>{pl.users} usuarios</li>
                    <li>{pl.matters} casos</li>
                    <li>{pl.storage} armazenamento</li>
                  </ul>
                </div>
              )
            })}
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Historico de Faturas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fatura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {billingHistory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {inv.invoice_number || inv.title || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {(inv.total_amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[inv.status] ?? 'bg-gray-50 text-gray-700'}`}>
                        {statusLabels[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {billingHistory.length === 0 && (
              <p className="text-sm text-gray-500 p-6 text-center">Nenhuma fatura encontrada.</p>
            )}
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}
