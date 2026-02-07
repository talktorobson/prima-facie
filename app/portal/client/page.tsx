'use client'

import Link from 'next/link'
import { useMyMatters, useMyInvoices, useMyDocuments } from '@/lib/queries/useClientPortal'
import { useAuthContext } from '@/lib/providers/auth-provider'
import {
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  FolderIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR')

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  closed: 'Encerrado',
  on_hold: 'Suspenso',
  settled: 'Acordo',
  dismissed: 'Arquivado',
  draft: 'Rascunho',
  sent: 'Enviada',
  viewed: 'Visualizada',
  paid: 'Paga',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  closed: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  on_hold: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  settled: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  dismissed: 'bg-gray-50 text-gray-600 ring-gray-500/20',
  draft: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  viewed: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  paid: 'bg-green-50 text-green-700 ring-green-600/20',
  overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-gray-50 text-gray-500 ring-gray-400/20',
}

interface MatterRow {
  id: string
  title: string
  matter_number: string
  status: string
  priority: string
  next_court_date: string | null
  opened_date: string | null
  matter_type: { name: string } | null
  responsible_lawyer: { full_name: string } | null
}

interface InvoiceRow {
  id: string
  invoice_number: string
  title: string | null
  total_amount: number
  outstanding_amount: number | null
  status: string
  due_date: string
}

export default function ClientPortalPage() {
  const { profile } = useAuthContext()
  const { data: matters, isLoading: mattersLoading } = useMyMatters()
  const { data: invoices, isLoading: invoicesLoading } = useMyInvoices()
  const { data: documents, isLoading: docsLoading } = useMyDocuments()

  const isLoading = mattersLoading || invoicesLoading || docsLoading

  const matterList = (matters ?? []) as MatterRow[]
  const invoiceList = (invoices ?? []) as InvoiceRow[]

  const activeMatters = matterList.filter((m) => m.status === 'active')
  const pendingInvoices = invoiceList.filter(
    (inv) => inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'viewed'
  )
  const pendingTotal = pendingInvoices.reduce(
    (sum, inv) => sum + (inv.outstanding_amount ?? inv.total_amount),
    0
  )

  const nextCourtDate = matterList
    .filter((m) => m.next_court_date)
    .sort((a, b) =>
      new Date(a.next_court_date!).getTime() - new Date(b.next_court_date!).getTime()
    )[0]?.next_court_date

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {profile?.full_name ?? profile?.first_name ?? 'Cliente'}!
        </h1>
        <p className="mt-1 text-gray-600">
          Acompanhe seus processos, faturas e documentos.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          icon={<DocumentTextIcon className="h-6 w-6 text-blue-600" />}
          label="Processos Ativos"
          value={String(activeMatters.length)}
        />
        <SummaryCard
          icon={<CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />}
          label="Faturas Pendentes"
          value={formatCurrency(pendingTotal)}
        />
        <SummaryCard
          icon={<CalendarIcon className="h-6 w-6 text-green-600" />}
          label="Proxima Audiencia"
          value={nextCourtDate ? formatDate(nextCourtDate) : 'Nenhuma'}
        />
        <SummaryCard
          icon={<FolderIcon className="h-6 w-6 text-purple-600" />}
          label="Documentos"
          value={String(documents?.length ?? 0)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent matters */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Processos Recentes</h3>
            <Link
              href="/portal/client/matters"
              className="text-sm text-primary hover:text-primary/80 flex items-center"
            >
              Ver todos <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="p-6">
            {matterList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum processo encontrado.
              </p>
            ) : (
              <div className="space-y-4">
                {matterList.slice(0, 5).map((matter) => (
                  <div
                    key={matter.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {matter.title}
                      </h4>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          statusColors[matter.status] ?? statusColors.active
                        }`}
                      >
                        {statusLabels[matter.status] ?? matter.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {matter.matter_number}
                      {matter.responsible_lawyer
                        ? ` - ${matter.responsible_lawyer.full_name}`
                        : ''}
                    </p>
                    {matter.next_court_date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Audiencia: {formatDate(matter.next_court_date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent invoices */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Faturas Recentes</h3>
          </div>
          <div className="p-6">
            {invoiceList.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma fatura encontrada.
              </p>
            ) : (
              <div className="space-y-4">
                {invoiceList.slice(0, 3).map((inv) => (
                  <div
                    key={inv.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {inv.title ?? inv.invoice_number}
                      </h4>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                          statusColors[inv.status] ?? statusColors.sent
                        }`}
                      >
                        {statusLabels[inv.status] ?? inv.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Vencimento: {formatDate(inv.due_date)}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(inv.total_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Acesso Rapido</h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink
            href="/portal/client/matters"
            icon={<DocumentTextIcon className="h-6 w-6 text-blue-600" />}
            title="Ver Processos"
            description="Acompanhe seus casos"
          />
          <QuickLink
            href="/portal/client/messages"
            icon={<CurrencyDollarIcon className="h-6 w-6 text-green-600" />}
            title="Mensagens"
            description="Fale com seu advogado"
          />
          <QuickLink
            href="/portal/client/profile"
            icon={<FolderIcon className="h-6 w-6 text-purple-600" />}
            title="Meu Perfil"
            description="Atualize seus dados"
          />
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5 flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-5 w-0 flex-1">
          <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
          <dd className="text-lg font-medium text-gray-900">{value}</dd>
        </div>
      </div>
    </div>
  )
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
    >
      <div className="mr-3">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </Link>
  )
}
