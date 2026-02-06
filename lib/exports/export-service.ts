// Master Export Service for Prima Facie
// Phase 8.10.4: Export & Reporting Engine Integration

import { excelExportService } from './excel-service'
import { pdfExportService } from './pdf-service'
import { collectionsService } from '@/lib/financial/collections-service'
import { financialService } from '@/lib/financial/financial-service'
import type {
  ExportOptions,
  ExportResult,
  FirmBranding,
  ExportColumn,
  AgingSummary,
  FinancialMetrics
} from './types'
import type {
  PaymentCollection,
  Bill,
  Vendor,
  AgingReport
} from '@/lib/financial/types'

class ExportService {
  private defaultBranding: FirmBranding = {
    name: 'Prima Facie - Legal Services',
    address: 'São Paulo, SP - Brasil',
    email: 'contato@primafacie.com.br',
    website: 'www.primafacie.com.br',
    primaryColor: '#1e40af'
  }

  // ====================================
  // COLLECTIONS EXPORTS
  // ====================================

  async exportCollections(
    lawFirmId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Get collections data
      const collections = await collectionsService.getCollections(lawFirmId, options.filters)
      
      if (collections.length === 0) {
        return {
          success: false,
          error: 'Nenhuma cobrança encontrada para exportar'
        }
      }

      let blob: Blob
      const filename = options.filename || `contas-receber_${new Date().toISOString().split('T')[0]}`

      if (options.format === 'excel') {
        blob = await excelExportService.exportCollections(collections)
      } else {
        blob = await pdfExportService.generateCollectionsReportPDF(
          collections,
          options.branding || this.defaultBranding
        )
      }

      return {
        success: true,
        blob,
        filename
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na exportação'
      }
    }
  }

  // ====================================
  // BILLS EXPORTS
  // ====================================

  async exportBills(
    lawFirmId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Get bills data
      const bills = await financialService.getBills(lawFirmId, options.filters)
      
      if (bills.length === 0) {
        return {
          success: false,
          error: 'Nenhuma conta a pagar encontrada para exportar'
        }
      }

      let blob: Blob
      const filename = options.filename || `contas-pagar_${new Date().toISOString().split('T')[0]}`

      if (options.format === 'excel') {
        blob = await excelExportService.exportBills(bills)
      } else {
        blob = await pdfExportService.generateBillsReportPDF(
          bills,
          options.branding || this.defaultBranding
        )
      }

      return {
        success: true,
        blob,
        filename
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na exportação'
      }
    }
  }

  // ====================================
  // VENDORS EXPORTS
  // ====================================

  async exportVendors(
    lawFirmId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Get vendors data
      const vendors = await financialService.getVendors(lawFirmId, options.filters)
      
      if (vendors.length === 0) {
        return {
          success: false,
          error: 'Nenhum fornecedor encontrado para exportar'
        }
      }

      let blob: Blob
      const filename = options.filename || `fornecedores_${new Date().toISOString().split('T')[0]}`

      if (options.format === 'excel') {
        blob = await excelExportService.exportVendors(vendors)
      } else {
        blob = await pdfExportService.generateVendorDirectoryPDF(
          vendors,
          options.branding || this.defaultBranding
        )
      }

      return {
        success: true,
        blob,
        filename
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na exportação'
      }
    }
  }

  // ====================================
  // AGING REPORT EXPORTS
  // ====================================

  async exportAgingReport(
    lawFirmId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Get aging report data
      const agingReport = await collectionsService.generateAgingReport(lawFirmId)
      
      if (!agingReport) {
        return {
          success: false,
          error: 'Não foi possível gerar o relatório de aging'
        }
      }

      let blob: Blob
      const filename = options.filename || `relatorio-aging_${new Date().toISOString().split('T')[0]}`

      if (options.format === 'excel') {
        blob = await excelExportService.exportAgingReport(agingReport)
      } else {
        blob = await pdfExportService.generateAgingReportPDF(
          agingReport,
          options.branding || this.defaultBranding
        )
      }

      return {
        success: true,
        blob,
        filename
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na exportação'
      }
    }
  }

  // ====================================
  // FINANCIAL DASHBOARD EXPORTS
  // ====================================

  async exportFinancialDashboard(
    lawFirmId: string,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Get comprehensive financial data
      const [
        agingReport,
        collections,
        bills,
        vendors
      ] = await Promise.all([
        collectionsService.generateAgingReport(lawFirmId),
        collectionsService.getCollections(lawFirmId),
        financialService.getBills(lawFirmId),
        financialService.getVendors(lawFirmId)
      ])

      const filename = options.filename || `dashboard-financeiro_${new Date().toISOString().split('T')[0]}`

      if (options.format === 'excel') {
        // Create multi-sheet Excel workbook
        const sheets = [
          { name: 'Resumo Aging', data: this.prepareAgingSummaryData(agingReport) },
          { name: 'Contas a Receber', data: this.prepareCollectionsData(collections) },
          { name: 'Contas a Pagar', data: this.prepareBillsData(bills) },
          { name: 'Fornecedores', data: this.prepareVendorsData(vendors) }
        ]

        const blob = await excelExportService.generateMultiSheetExcel(sheets, 'Dashboard Financeiro')
        
        return {
          success: true,
          blob,
          filename
        }
      } else {
        // Generate comprehensive PDF report
        const blob = await this.generateComprehensivePDFReport(
          { agingReport, collections, bills, vendors },
          options.branding || this.defaultBranding
        )
        
        return {
          success: true,
          blob,
          filename
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na exportação do dashboard'
      }
    }
  }

  // ====================================
  // HELPER METHODS
  // ====================================

  private prepareAgingSummaryData(agingReport: AgingReport) {
    return [
      { Categoria: 'Contas a Receber - Em Dia', Valor: agingReport.receivables_current },
      { Categoria: 'Contas a Receber - 1-30 dias', Valor: agingReport.receivables_overdue_30 },
      { Categoria: 'Contas a Receber - 31-60 dias', Valor: agingReport.receivables_overdue_60 },
      { Categoria: 'Contas a Receber - 61-90 dias', Valor: agingReport.receivables_overdue_90 },
      { Categoria: 'Contas a Receber - 90+ dias', Valor: agingReport.receivables_over_90 },
      { Categoria: 'Total a Receber', Valor: agingReport.receivables_total },
      { Categoria: '', Valor: '' },
      { Categoria: 'Contas a Pagar - Em Dia', Valor: agingReport.payables_current },
      { Categoria: 'Contas a Pagar - 1-30 dias', Valor: agingReport.payables_overdue_30 },
      { Categoria: 'Contas a Pagar - 31-60 dias', Valor: agingReport.payables_overdue_60 },
      { Categoria: 'Contas a Pagar - 61-90 dias', Valor: agingReport.payables_overdue_90 },
      { Categoria: 'Contas a Pagar - 90+ dias', Valor: agingReport.payables_over_90 },
      { Categoria: 'Total a Pagar', Valor: agingReport.payables_total },
      { Categoria: '', Valor: '' },
      { Categoria: 'Fluxo Líquido', Valor: agingReport.receivables_total - agingReport.payables_total }
    ]
  }

  private prepareCollectionsData(collections: PaymentCollection[]) {
    return collections.map(collection => ({
      Cliente: collection.client?.name || '',
      Fatura: collection.invoice?.invoice_number || '',
      'Valor Total': collection.invoice?.total_amount || 0,
      'Saldo Devedor': collection.invoice?.balance_due || 0,
      'Dias Atraso': collection.days_overdue,
      Status: collection.collection_status,
      'Último Lembrete': collection.last_reminder_sent || '',
      'Qtd Lembretes': collection.reminder_count || 0
    }))
  }

  private prepareBillsData(bills: Bill[]) {
    return bills.map(bill => ({
      Fornecedor: bill.vendor?.name || '',
      'Número': bill.bill_number,
      'Valor Total': bill.total_amount,
      'Saldo Devedor': bill.balance_due,
      'Vencimento': bill.due_date,
      'Status Pagamento': bill.payment_status,
      'Status Aprovação': bill.approval_status
    }))
  }

  private prepareVendorsData(vendors: Vendor[]) {
    return vendors.map(vendor => ({
      Nome: vendor.name,
      Tipo: vendor.vendor_type,
      'CNPJ/CPF': vendor.cnpj || vendor.cpf || '',
      Email: vendor.email || '',
      Telefone: vendor.phone || '',
      Ativo: vendor.is_active ? 'Sim' : 'Não'
    }))
  }

  private async generateComprehensivePDFReport(
    data: {
      agingReport: AgingReport
      collections: PaymentCollection[]
      bills: Bill[]
      vendors: Vendor[]
    },
    branding: FirmBranding
  ): Promise<Blob> {
    // For now, generate aging report PDF - could be extended to include all sections
    return await pdfExportService.generateAgingReportPDF(data.agingReport, branding)
  }

  // ====================================
  // DOWNLOAD METHODS
  // ====================================

  downloadFile(blob: Blob, filename: string, format: 'excel' | 'pdf'): void {
    const extension = format === 'excel' ? 'xlsx' : 'pdf'
    const mimeType = format === 'excel' 
      ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      : 'application/pdf'

    const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // ====================================
  // GENERIC EXPORT METHOD
  // ====================================

  async exportEntityData<T>(
    data: T[],
    columns: ExportColumn[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      if (data.length === 0) {
        return {
          success: false,
          error: 'Nenhum dado encontrado para exportar'
        }
      }

      let blob: Blob
      const filename = options.filename || `exportacao_${new Date().toISOString().split('T')[0]}`

      if (options.format === 'excel') {
        blob = await excelExportService.exportGenericEntity(
          data as any[],
          columns,
          'Dados Exportados'
        )
      } else {
        // For PDF, would need to implement generic PDF generation
        throw new Error('Exportação PDF genérica não implementada ainda')
      }

      return {
        success: true,
        blob,
        filename
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro na exportação'
      }
    }
  }
}

export const exportService = new ExportService()