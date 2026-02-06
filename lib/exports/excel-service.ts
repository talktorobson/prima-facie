// Excel Export Service for Prima Facie
// Phase 8.10.4: Export & Reporting Engine

import * as XLSX from 'xlsx'
import type { 
  PaymentCollection,
  Bill,
  Vendor,
  AgingReport
} from '@/lib/financial/types'

interface ExportableEntity {
  id: string
  [key: string]: any
}

class ExcelExportService {
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  private formatDate(date: string | Date): string {
    if (!date) return ''
    return new Date(date).toLocaleDateString('pt-BR')
  }

  private formatBoolean(value: boolean): string {
    return value ? 'Sim' : 'Não'
  }

  // ====================================
  // ACCOUNTS RECEIVABLE EXPORTS
  // ====================================

  async exportCollections(collections: PaymentCollection[]): Promise<Blob> {
    const data = collections.map(collection => ({
      'ID': collection.id,
      'Cliente': collection.client?.name || '',
      'E-mail': collection.client?.email || '',
      'Telefone': collection.client?.phone || '',
      'Fatura': collection.invoice?.invoice_number || '',
      'Valor Total': this.formatCurrency(collection.invoice?.total_amount || 0),
      'Saldo Devedor': this.formatCurrency(collection.invoice?.balance_due || 0),
      'Data Vencimento': this.formatDate(collection.invoice?.due_date || ''),
      'Status Cobrança': this.getCollectionStatusLabel(collection.collection_status),
      'Dias Atraso': collection.days_overdue,
      'Último Lembrete': this.formatDate(collection.last_reminder_sent || ''),
      'Qtd Lembretes': collection.reminder_count || 0,
      'É Contestado': this.formatBoolean(collection.is_disputed),
      'Motivo Contestação': collection.dispute_reason || '',
      'Data Contestação': this.formatDate(collection.dispute_date || ''),
      'Data Promessa': this.formatDate(collection.promise_to_pay_date || ''),
      'Valor Promessa': collection.promise_to_pay_amount ? this.formatCurrency(collection.promise_to_pay_amount) : '',
      'Observações Promessa': collection.promise_to_pay_notes || '',
      'Data Baixa': this.formatDate(collection.written_off_date || ''),
      'Valor Baixa': collection.written_off_amount ? this.formatCurrency(collection.written_off_amount) : '',
      'Motivo Baixa': collection.written_off_reason || '',
      'Observações': collection.collection_notes || '',
      'Criado em': this.formatDate(collection.created_at),
      'Atualizado em': this.formatDate(collection.updated_at)
    }))

    return this.generateExcelFile(data, 'Contas a Receber')
  }

  async exportAgingReport(agingReport: AgingReport): Promise<Blob> {
    // Summary sheet data
    const summaryData = [
      { 'Categoria': 'Contas a Receber - Em Dia', 'Valor': this.formatCurrency(agingReport.receivables_current) },
      { 'Categoria': 'Contas a Receber - 1-30 dias', 'Valor': this.formatCurrency(agingReport.receivables_overdue_30) },
      { 'Categoria': 'Contas a Receber - 31-60 dias', 'Valor': this.formatCurrency(agingReport.receivables_overdue_60) },
      { 'Categoria': 'Contas a Receber - 61-90 dias', 'Valor': this.formatCurrency(agingReport.receivables_overdue_90) },
      { 'Categoria': 'Contas a Receber - 90+ dias', 'Valor': this.formatCurrency(agingReport.receivables_over_90) },
      { 'Categoria': 'Total a Receber', 'Valor': this.formatCurrency(agingReport.receivables_total) },
      { 'Categoria': '', 'Valor': '' },
      { 'Categoria': 'Contas a Pagar - Em Dia', 'Valor': this.formatCurrency(agingReport.payables_current) },
      { 'Categoria': 'Contas a Pagar - 1-30 dias', 'Valor': this.formatCurrency(agingReport.payables_overdue_30) },
      { 'Categoria': 'Contas a Pagar - 31-60 dias', 'Valor': this.formatCurrency(agingReport.payables_overdue_60) },
      { 'Categoria': 'Contas a Pagar - 61-90 dias', 'Valor': this.formatCurrency(agingReport.payables_overdue_90) },
      { 'Categoria': 'Contas a Pagar - 90+ dias', 'Valor': this.formatCurrency(agingReport.payables_over_90) },
      { 'Categoria': 'Total a Pagar', 'Valor': this.formatCurrency(agingReport.payables_total) },
      { 'Categoria': '', 'Valor': '' },
      { 'Categoria': 'Fluxo Líquido', 'Valor': this.formatCurrency(agingReport.receivables_total - agingReport.payables_total) }
    ]

    // Receivables details
    const receivablesData = agingReport.receivables_details?.map(collection => ({
      'Cliente': collection.client?.name || '',
      'Fatura': collection.invoice?.invoice_number || '',
      'Valor': this.formatCurrency(collection.invoice?.balance_due || 0),
      'Vencimento': this.formatDate(collection.invoice?.due_date || ''),
      'Dias Atraso': collection.days_overdue,
      'Status': this.getCollectionStatusLabel(collection.collection_status)
    })) || []

    // Payables details
    const payablesData = agingReport.payables_details?.map(bill => ({
      'Fornecedor': bill.vendor?.name || '',
      'Fatura': bill.bill_number,
      'Valor': this.formatCurrency(bill.balance_due),
      'Vencimento': this.formatDate(bill.due_date),
      'Dias Atraso': Math.max(0, Math.floor((new Date().getTime() - new Date(bill.due_date).getTime()) / (1000 * 3600 * 24))),
      'Status': bill.payment_status === 'pending' ? 'Pendente' : bill.payment_status === 'partial' ? 'Parcial' : 'Em Atraso'
    })) || []

    return this.generateMultiSheetExcel([
      { name: 'Resumo', data: summaryData },
      { name: 'Recebíveis', data: receivablesData },
      { name: 'Pagáveis', data: payablesData }
    ], 'Relatório de Aging')
  }

  // ====================================
  // ACCOUNTS PAYABLE EXPORTS
  // ====================================

  async exportBills(bills: Bill[]): Promise<Blob> {
    const data = bills.map(bill => ({
      'ID': bill.id,
      'Número': bill.bill_number,
      'Fornecedor': bill.vendor?.name || '',
      'CNPJ/CPF': bill.vendor?.cnpj || bill.vendor?.cpf || '',
      'Categoria': bill.expense_category?.name || '',
      'Descrição': bill.description,
      'Valor Total': this.formatCurrency(bill.total_amount),
      'Saldo Devedor': this.formatCurrency(bill.balance_due),
      'Data Emissão': this.formatDate(bill.issue_date),
      'Data Vencimento': this.formatDate(bill.due_date),
      'Status Pagamento': this.getPaymentStatusLabel(bill.payment_status),
      'Status Aprovação': this.getApprovalStatusLabel(bill.approval_status),
      'Aprovado Por': bill.approved_by_name || '',
      'Data Aprovação': this.formatDate(bill.approval_date || ''),
      'É Recorrente': this.formatBoolean(bill.is_recurring),
      'Frequência': bill.recurrence_frequency || '',
      'Observações': bill.notes || '',
      'Criado em': this.formatDate(bill.created_at),
      'Atualizado em': this.formatDate(bill.updated_at)
    }))

    return this.generateExcelFile(data, 'Contas a Pagar')
  }

  async exportVendors(vendors: Vendor[]): Promise<Blob> {
    const data = vendors.map(vendor => ({
      'ID': vendor.id,
      'Nome': vendor.name,
      'Tipo': this.getVendorTypeLabel(vendor.vendor_type),
      'CNPJ': vendor.cnpj || '',
      'CPF': vendor.cpf || '',
      'E-mail': vendor.email || '',
      'Telefone': vendor.phone || '',
      'Contato': vendor.contact_person || '',
      'Endereço': `${vendor.address || ''} ${vendor.city || ''} ${vendor.state || ''}`.trim(),
      'CEP': vendor.zip_code || '',
      'Banco': vendor.bank_name || '',
      'Agência': vendor.bank_branch || '',
      'Conta': vendor.bank_account || '',
      'Chave PIX': vendor.pix_key || '',
      'Ativo': this.formatBoolean(vendor.is_active),
      'Observações': vendor.notes || '',
      'Criado em': this.formatDate(vendor.created_at),
      'Atualizado em': this.formatDate(vendor.updated_at)
    }))

    return this.generateExcelFile(data, 'Fornecedores')
  }

  // ====================================
  // GENERAL EXPORTS
  // ====================================

  async exportGenericEntity<T extends ExportableEntity>(
    entities: T[],
    columns: { key: string; label: string; type?: 'currency' | 'date' | 'boolean' }[],
    sheetName: string
  ): Promise<Blob> {
    const data = entities.map(entity => {
      const row: Record<string, any> = {}
      
      columns.forEach(column => {
        const value = entity[column.key]
        
        switch (column.type) {
          case 'currency':
            row[column.label] = typeof value === 'number' ? this.formatCurrency(value) : ''
            break
          case 'date':
            row[column.label] = this.formatDate(value)
            break
          case 'boolean':
            row[column.label] = this.formatBoolean(value)
            break
          default:
            row[column.label] = value || ''
        }
      })
      
      return row
    })

    return this.generateExcelFile(data, sheetName)
  }

  // ====================================
  // UTILITY METHODS
  // ====================================

  private generateExcelFile(data: any[], sheetName: string): Blob {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    
    // Set column widths
    const colWidths = Object.keys(data[0] || {}).map(() => ({ wch: 20 }))
    worksheet['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  private generateMultiSheetExcel(
    sheets: { name: string; data: any[] }[],
    filename: string
  ): Blob {
    const workbook = XLSX.utils.book_new()
    
    sheets.forEach(sheet => {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data)
      
      // Set column widths
      const colWidths = Object.keys(sheet.data[0] || {}).map(() => ({ wch: 20 }))
      worksheet['!cols'] = colWidths
      
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
    })
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  // Label formatters
  private getCollectionStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'current': 'Em Dia',
      'overdue_30': '1-30 dias',
      'overdue_60': '31-60 dias',
      'overdue_90': '61-90 dias',
      'in_collection': 'Em Cobrança',
      'disputed': 'Contestado',
      'written_off': 'Baixado'
    }
    return labels[status] || status
  }

  private getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'partial': 'Parcial',
      'paid': 'Pago',
      'overdue': 'Em Atraso',
      'cancelled': 'Cancelado'
    }
    return labels[status] || status
  }

  private getApprovalStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado'
    }
    return labels[status] || status
  }

  private getVendorTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'supplier': 'Fornecedor',
      'contractor': 'Prestador',
      'service_provider': 'Serviços',
      'utility': 'Utilidade',
      'government': 'Governo',
      'other': 'Outro'
    }
    return labels[type] || type
  }

  // ====================================
  // PUBLIC DOWNLOAD METHODS
  // ====================================

  downloadExcelFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export const excelExportService = new ExcelExportService()