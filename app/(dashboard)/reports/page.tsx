'use client'

import { useState } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import {
  CurrencyDollarIcon,
  FolderIcon,
  UsersIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { FinancialTab, MattersTab, TeamTab, ClientsTab } from '@/components/reports/report-tabs'

type TabId = 'financial' | 'matters' | 'team' | 'clients'

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'financial', label: 'Financeiro', icon: CurrencyDollarIcon },
  { id: 'matters', label: 'Processos', icon: FolderIcon },
  { id: 'team', label: 'Equipe', icon: UsersIcon },
  { id: 'clients', label: 'Clientes', icon: ChartBarIcon },
]

export default function ReportsPage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const [activeTab, setActiveTab] = useState<TabId>('financial')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  if (!effectiveLawFirmId) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Sem acesso</h3>
        <p className="mt-1 text-sm text-gray-500">
          Voce precisa estar vinculado a um escritorio para visualizar relatorios.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatorios</h1>
          <p className="mt-1 text-gray-600">Analises e dados do escritorio</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Periodo:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <span className="text-gray-500 text-sm">ate</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'financial' && <FinancialTab lawFirmId={effectiveLawFirmId!} dateRange={dateRange} />}
      {activeTab === 'matters' && <MattersTab lawFirmId={effectiveLawFirmId!} dateRange={dateRange} />}
      {activeTab === 'team' && <TeamTab lawFirmId={effectiveLawFirmId!} dateRange={dateRange} />}
      {activeTab === 'clients' && <ClientsTab lawFirmId={effectiveLawFirmId!} dateRange={dateRange} />}
    </div>
  )
}
