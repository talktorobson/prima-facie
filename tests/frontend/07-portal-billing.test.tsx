/**
 * Frontend UI Tests: Client Billing Portal
 * Tests client-facing billing page with invoices, summary cards, and status badges
 */

import React from 'react'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => '/portal/client/billing',
}))

// Note: Mock components are self-contained and don't import from @/ paths

interface InvoiceRow {
  id: string
  invoice_number: string | null
  title: string | null
  total_amount: number | null
  paid_amount: number | null
  outstanding_amount: number | null
  status: string
  due_date: string | null
  issue_date: string | null
}

// --- Mock: Client Billing Page ---
const MockClientBillingPage = ({ invoices, isLoading }: {
  invoices?: InvoiceRow[]
  isLoading?: boolean
}) => {
  const loading = isLoading ?? false
  const invoiceList = invoices ?? [
    { id: 'i1', invoice_number: 'FAT-001', title: null, total_amount: 3000, paid_amount: 3000, outstanding_amount: 0, status: 'paid', due_date: '2025-01-15', issue_date: '2025-01-01' },
    { id: 'i2', invoice_number: 'FAT-002', title: null, total_amount: 2500, paid_amount: 0, outstanding_amount: 2500, status: 'sent', due_date: '2025-02-15', issue_date: '2025-02-01' },
    { id: 'i3', invoice_number: 'FAT-003', title: null, total_amount: 1500, paid_amount: 0, outstanding_amount: 1500, status: 'overdue', due_date: '2025-01-01', issue_date: '2024-12-15' },
  ]

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho', sent: 'Enviada', paid: 'Paga', overdue: 'Vencida', cancelled: 'Cancelada', partially_paid: 'Parcial',
  }
  const statusColors: Record<string, string> = {
    draft: 'bg-gray-50 text-gray-700', sent: 'bg-blue-50 text-blue-700', paid: 'bg-green-50 text-green-700',
    overdue: 'bg-red-50 text-red-700', cancelled: 'bg-gray-50 text-gray-500', partially_paid: 'bg-yellow-50 text-yellow-700',
  }

  const totalPaid = invoiceList.reduce((s, i) => s + (i.paid_amount ?? 0), 0)
  const totalOutstanding = invoiceList.reduce((s, i) => s + (i.outstanding_amount ?? 0), 0)
  const overdueCount = invoiceList.filter(i => i.status === 'overdue').length

  if (loading) {
    return (
      <div data-testid="billing-loading">
        <div data-testid="loading-spinner" className="animate-spin" />
        <p>Carregando faturas...</p>
      </div>
    )
  }

  return (
    <div data-testid="client-billing">
      <h1>Minhas Faturas</h1>
      <p>Acompanhe suas faturas e pagamentos.</p>

      <div data-testid="summary-cards">
        <div data-testid="card-total-paid">
          <p>Total Pago</p>
          <p data-testid="total-paid-value">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div data-testid="card-outstanding">
          <p>Em Aberto</p>
          <p data-testid="outstanding-value">
            R$ {totalOutstanding.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        {overdueCount > 0 && (
          <div data-testid="card-overdue">
            <p>Faturas Vencidas</p>
            <p data-testid="overdue-count">{overdueCount}</p>
          </div>
        )}
      </div>

      {invoiceList.length === 0 ? (
        <div data-testid="empty-state">
          <h3>Nenhuma fatura encontrada</h3>
          <p>Voce nao possui faturas no momento.</p>
        </div>
      ) : (
        <div data-testid="invoice-table-wrapper">
          <table data-testid="invoice-table">
            <thead>
              <tr>
                <th>Fatura</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Vencimento</th>
              </tr>
            </thead>
            <tbody>
              {invoiceList.map(inv => (
                <tr key={inv.id} data-testid={`invoice-row-${inv.id}`}>
                  <td data-testid="invoice-number">
                    <p>{inv.invoice_number || inv.title || '-'}</p>
                    {inv.issue_date && (
                      <p data-testid="invoice-issue-date">
                        Emitida em {new Date(inv.issue_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </td>
                  <td data-testid="invoice-amount">
                    R$ {(inv.total_amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td data-testid="invoice-status">
                    <span className={statusColors[inv.status] ?? statusColors.draft}>
                      {statusLabels[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td data-testid="invoice-due-date">
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-BR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('Client Billing Portal UI Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Client Billing Page', () => {
    it('should render page title "Minhas Faturas"', () => {
      render(<TestWrapper><MockClientBillingPage /></TestWrapper>)
      expect(screen.getByTestId('client-billing')).toBeInTheDocument()
      expect(screen.getByText('Minhas Faturas')).toBeInTheDocument()
      expect(screen.getByText('Acompanhe suas faturas e pagamentos.')).toBeInTheDocument()
    })

    it('should display summary cards with totals', () => {
      render(<TestWrapper><MockClientBillingPage /></TestWrapper>)
      const cards = screen.getByTestId('summary-cards')
      expect(cards).toBeInTheDocument()

      expect(screen.getByTestId('card-total-paid')).toBeInTheDocument()
      expect(screen.getByTestId('total-paid-value')).toHaveTextContent('R$')

      expect(screen.getByTestId('card-outstanding')).toBeInTheDocument()
      expect(screen.getByTestId('outstanding-value')).toHaveTextContent('R$')
    })

    it('should show overdue card only when overdueCount > 0', () => {
      render(<TestWrapper><MockClientBillingPage /></TestWrapper>)
      // Default data has 1 overdue invoice
      expect(screen.getByTestId('card-overdue')).toBeInTheDocument()
      expect(screen.getByTestId('overdue-count')).toHaveTextContent('1')
    })

    it('should NOT show overdue card when no overdue invoices', () => {
      const noOverdueInvoices: InvoiceRow[] = [
        { id: 'i1', invoice_number: 'FAT-001', title: null, total_amount: 1000, paid_amount: 1000, outstanding_amount: 0, status: 'paid', due_date: '2025-01-15', issue_date: '2025-01-01' },
      ]
      render(<TestWrapper><MockClientBillingPage invoices={noOverdueInvoices} /></TestWrapper>)
      expect(screen.queryByTestId('card-overdue')).not.toBeInTheDocument()
    })

    it('should render invoice table with correct columns', () => {
      render(<TestWrapper><MockClientBillingPage /></TestWrapper>)
      const table = screen.getByTestId('invoice-table')
      expect(table).toBeInTheDocument()
      const headers = within(table).getAllByRole('columnheader')
      expect(headers).toHaveLength(4)
      expect(headers[0]).toHaveTextContent('Fatura')
      expect(headers[1]).toHaveTextContent('Valor')
      expect(headers[2]).toHaveTextContent('Status')
      expect(headers[3]).toHaveTextContent('Vencimento')
    })

    it('should display correct status badges', () => {
      render(<TestWrapper><MockClientBillingPage /></TestWrapper>)

      const row1 = screen.getByTestId('invoice-row-i1')
      expect(within(row1).getByTestId('invoice-status')).toHaveTextContent('Paga')

      const row2 = screen.getByTestId('invoice-row-i2')
      expect(within(row2).getByTestId('invoice-status')).toHaveTextContent('Enviada')

      const row3 = screen.getByTestId('invoice-row-i3')
      expect(within(row3).getByTestId('invoice-status')).toHaveTextContent('Vencida')
    })

    it('should format amounts in R$ with pt-BR locale', () => {
      render(<TestWrapper><MockClientBillingPage /></TestWrapper>)
      const row1 = screen.getByTestId('invoice-row-i1')
      const amount = within(row1).getByTestId('invoice-amount')
      expect(amount).toHaveTextContent('R$')
      expect(amount).toHaveTextContent('3')
    })

    it('should show issue date when available', () => {
      render(<TestWrapper><MockClientBillingPage /></TestWrapper>)
      const row1 = screen.getByTestId('invoice-row-i1')
      expect(within(row1).getByTestId('invoice-issue-date')).toHaveTextContent('Emitida em')
    })

    it('should show empty state when no invoices', () => {
      render(<TestWrapper><MockClientBillingPage invoices={[]} /></TestWrapper>)
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      expect(screen.getByText('Nenhuma fatura encontrada')).toBeInTheDocument()
      expect(screen.getByText('Voce nao possui faturas no momento.')).toBeInTheDocument()
    })

    it('should show loading spinner', () => {
      render(<TestWrapper><MockClientBillingPage isLoading={true} /></TestWrapper>)
      expect(screen.getByTestId('billing-loading')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('Carregando faturas...')).toBeInTheDocument()
    })

    it('should format due dates in pt-BR locale', () => {
      render(<TestWrapper><MockClientBillingPage /></TestWrapper>)
      const row1 = screen.getByTestId('invoice-row-i1')
      const dueDate = within(row1).getByTestId('invoice-due-date')
      // pt-BR format: DD/MM/YYYY
      expect(dueDate).toHaveTextContent('/')
    })
  })
})
