'use client'

import { useMemo, useCallback } from 'react'
import { useToast } from '@/components/ui/toast-provider'
import {
  useFinancialReport,
  useMatterReport,
  useTeamReport,
  useClientReport,
} from '@/lib/queries/useReports'
import {
  SummaryCard, BarChart, PieChartComponent, ExportButton,
  LoadingState, ErrorState, EmptyState,
  formatCurrency, formatDate, translateStatus, downloadCSV,
} from './report-shared'

interface TabProps {
  lawFirmId: string
  dateRange: { start: string; end: string }
}

export function FinancialTab({ lawFirmId, dateRange }: TabProps) {
  const { data, isLoading, error } = useFinancialReport(lawFirmId, dateRange)
  const toast = useToast()

  const byStatusData = useMemo(() => {
    if (!data?.byStatus) return []
    return Object.entries(data.byStatus).map(([status, value]) => ({
      label: translateStatus(status), value: value as number,
    }))
  }, [data?.byStatus])

  const handleExport = useCallback(() => {
    if (!data) return
    const lines: string[] = [
      '"Relatorio Financeiro"',
      `"Periodo","${dateRange.start} a ${dateRange.end}"`,
      '', '"Metrica","Valor"',
      `"Total Faturado","${formatCurrency(data.totalBilled)}"`,
      `"Total Recebido","${formatCurrency(data.totalPaid)}"`,
      `"Total Pendente","${formatCurrency(data.totalOutstanding)}"`,
      `"Faturas Vencidas","${data.overdueCount}"`,
      '', '"Status","Valor"',
      ...Object.entries(data.byStatus).map(
        ([status, value]) => `"${translateStatus(status)}","${formatCurrency(value as number)}"`
      ),
      '', '"Data Emissao","Valor Total","Valor Pago","Pendente","Status"',
      ...data.invoices.map((inv) =>
        `"${formatDate(inv.issue_date)}","${formatCurrency(inv.total_amount || 0)}","${formatCurrency(inv.paid_amount || 0)}","${formatCurrency(inv.outstanding_amount || 0)}","${translateStatus(inv.status || 'draft')}"`
      ),
    ]
    downloadCSV(lines.join('\n'), 'relatorio_financeiro')
    toast.success('Relatorio financeiro exportado com sucesso!')
  }, [data, dateRange, toast])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} />
  if (!data || data.invoices.length === 0) return <EmptyState />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Faturado" value={formatCurrency(data.totalBilled)} color="blue" />
        <SummaryCard label="Total Recebido" value={formatCurrency(data.totalPaid)} color="green" />
        <SummaryCard label="Total Pendente" value={formatCurrency(data.totalOutstanding)} color="yellow" />
        <SummaryCard label="Faturas Vencidas" value={data.overdueCount} color="red" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Faturamento por Status</h3>
          {byStatusData.length > 0 ? <BarChart data={byStatusData} valuePrefix="R$ " /> : <p className="text-sm text-gray-500">Sem dados</p>}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Ultimas Faturas</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.invoices.slice(0, 10).map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-700">{formatDate(inv.issue_date)}</td>
                    <td className="px-3 py-2 text-gray-900 font-medium">{formatCurrency(inv.total_amount || 0)}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                        {translateStatus(inv.status || 'draft')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ExportButton onClick={handleExport} />
    </div>
  )
}

export function MattersTab({ lawFirmId, dateRange }: TabProps) {
  const { data, isLoading, error } = useMatterReport(lawFirmId, dateRange)
  const toast = useToast()

  const byStatusData = useMemo(() => {
    if (!data?.byStatus) return []
    return Object.entries(data.byStatus).map(([status, count]) => ({
      label: translateStatus(status), value: count,
    }))
  }, [data?.byStatus])

  const byTypeData = useMemo(() => {
    if (!data?.byType) return []
    return Object.entries(data.byType).map(([typeName, count]) => ({
      label: typeName, value: count,
    }))
  }, [data?.byType])

  const handleExport = useCallback(() => {
    if (!data) return
    const lines: string[] = [
      '"Relatorio de Processos"',
      `"Periodo","${dateRange.start} a ${dateRange.end}"`,
      '', '"Metrica","Valor"',
      `"Total de Processos","${data.total}"`,
      `"Abertos no Periodo","${data.openedInRange}"`,
      `"Encerrados no Periodo","${data.closedInRange}"`,
      '', '"Status","Quantidade"',
      ...Object.entries(data.byStatus).map(([s, c]) => `"${translateStatus(s)}","${c}"`),
      '', '"Tipo","Quantidade"',
      ...Object.entries(data.byType).map(([t, c]) => `"${t}","${c}"`),
    ]
    downloadCSV(lines.join('\n'), 'relatorio_processos')
    toast.success('Relatorio de processos exportado com sucesso!')
  }, [data, dateRange, toast])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} />
  if (!data) return <EmptyState />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard label="Total de Processos" value={data.total} color="blue" />
        <SummaryCard label="Abertos no Periodo" value={data.openedInRange} color="green" />
        <SummaryCard label="Encerrados no Periodo" value={data.closedInRange} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Processos por Status</h3>
          {byStatusData.length > 0 ? <PieChartComponent data={byStatusData} /> : <p className="text-sm text-gray-500">Sem dados</p>}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Processos por Tipo</h3>
          {byTypeData.length > 0 ? <BarChart data={byTypeData} /> : <p className="text-sm text-gray-500">Sem dados</p>}
        </div>
      </div>
      <ExportButton onClick={handleExport} />
    </div>
  )
}

export function TeamTab({ lawFirmId, dateRange }: TabProps) {
  const { data, isLoading, error } = useTeamReport(lawFirmId, dateRange)
  const toast = useToast()

  const teamRows = useMemo(() => {
    if (!data?.byUser) return []
    return Object.entries(data.byUser).map(([userId, info]) => ({
      id: userId, ...info,
      billableRatio: info.totalHours > 0 ? Math.round((info.billableHours / info.totalHours) * 100) : 0,
    })).sort((a, b) => b.totalHours - a.totalHours)
  }, [data?.byUser])

  const totalHours = useMemo(() => teamRows.reduce((s, r) => s + r.totalHours, 0), [teamRows])
  const totalBillable = useMemo(() => teamRows.reduce((s, r) => s + r.billableHours, 0), [teamRows])
  const avgRatio = totalHours > 0 ? Math.round((totalBillable / totalHours) * 100) : 0
  const chartData = useMemo(() => teamRows.map((r) => ({ label: r.name, value: r.totalHours })), [teamRows])

  const handleExport = useCallback(() => {
    if (!data) return
    const lines: string[] = [
      '"Relatorio da Equipe"',
      `"Periodo","${dateRange.start} a ${dateRange.end}"`,
      '', '"Membro","Horas Totais","Horas Faturaveis","Ratio %"',
      ...teamRows.map((r) => `"${r.name}","${r.totalHours.toFixed(1)}","${r.billableHours.toFixed(1)}","${r.billableRatio}%"`),
    ]
    downloadCSV(lines.join('\n'), 'relatorio_equipe')
    toast.success('Relatorio da equipe exportado com sucesso!')
  }, [data, teamRows, dateRange, toast])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} />
  if (!data || teamRows.length === 0) return <EmptyState />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Lancamentos" value={data.totalEntries} color="blue" />
        <SummaryCard label="Horas Totais" value={`${totalHours.toFixed(1)}h`} color="indigo" />
        <SummaryCard label="Horas Faturaveis" value={`${totalBillable.toFixed(1)}h`} color="green" />
        <SummaryCard label="Ratio Faturavel" value={`${avgRatio}%`} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Horas por Membro</h3>
          <BarChart data={chartData} />
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Detalhamento</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Membro</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Faturavel</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900 font-medium">{row.name}</td>
                    <td className="px-3 py-2 text-gray-700">{row.totalHours.toFixed(1)}h</td>
                    <td className="px-3 py-2 text-gray-700">{row.billableHours.toFixed(1)}h</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${row.billableRatio}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{row.billableRatio}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ExportButton onClick={handleExport} />
    </div>
  )
}

export function ClientsTab({ lawFirmId, dateRange }: TabProps) {
  const { data, isLoading, error } = useClientReport(lawFirmId, dateRange)
  const toast = useToast()

  const byStatusData = useMemo(() => {
    if (!data?.byStatus) return []
    return Object.entries(data.byStatus).map(([status, count]) => ({
      label: translateStatus(status), value: count,
    }))
  }, [data?.byStatus])

  const revenueChartData = useMemo(() => {
    if (!data?.topClients) return []
    return data.topClients.map((c) => ({ label: c.name, value: c.totalBilled }))
  }, [data?.topClients])

  const handleExport = useCallback(() => {
    if (!data) return
    const lines: string[] = [
      '"Relatorio de Clientes"',
      `"Periodo","${dateRange.start} a ${dateRange.end}"`,
      '', `"Total de Clientes","${data.total}"`,
      '', '"Status","Quantidade"',
      ...Object.entries(data.byStatus).map(([s, c]) => `"${translateStatus(s)}","${c}"`),
      '', '"Cliente","Total Faturado","Total Pago"',
      ...data.topClients.map((c) => `"${c.name}","${formatCurrency(c.totalBilled)}","${formatCurrency(c.totalPaid)}"`),
    ]
    downloadCSV(lines.join('\n'), 'relatorio_clientes')
    toast.success('Relatorio de clientes exportado com sucesso!')
  }, [data, dateRange, toast])

  if (isLoading) return <LoadingState />
  if (error) return <ErrorState message={(error as Error).message} />
  if (!data) return <EmptyState />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <SummaryCard label="Total de Clientes" value={data.total} color="blue" />
        <SummaryCard label="Total Faturado" value={formatCurrency(data.topClients.reduce((s, c) => s + c.totalBilled, 0))} color="green" />
        <SummaryCard label="Total Recebido" value={formatCurrency(data.topClients.reduce((s, c) => s + c.totalPaid, 0))} color="purple" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Clientes por Status</h3>
          {byStatusData.length > 0 ? <PieChartComponent data={byStatusData} /> : <p className="text-sm text-gray-500">Sem dados</p>}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Receita por Cliente (Top 10)</h3>
          {revenueChartData.length > 0 ? <BarChart data={revenueChartData} valuePrefix="R$ " /> : <p className="text-sm text-gray-500">Sem dados</p>}
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Detalhamento de Clientes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Faturado</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total Pago</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pendente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.topClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900 font-medium">{client.name}</td>
                  <td className="px-3 py-2 text-gray-700">{formatCurrency(client.totalBilled)}</td>
                  <td className="px-3 py-2 text-gray-700">{formatCurrency(client.totalPaid)}</td>
                  <td className="px-3 py-2 text-gray-700">{formatCurrency(client.totalBilled - client.totalPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ExportButton onClick={handleExport} />
    </div>
  )
}
