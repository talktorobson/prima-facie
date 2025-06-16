// PDF Export Service for Prima Facie
// Phase 8.10.4: Export & Reporting Engine with Firm Branding

import jsPDF from 'jspdf'
import 'jspdf-autotable'
import type { 
  PaymentCollection,
  Bill,
  Vendor,
  AgingReport
} from '@/lib/financial/types'

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
  }
}

interface FirmBranding {
  name: string
  logo?: string // Base64 or URL
  address?: string
  phone?: string
  email?: string
  website?: string
  primaryColor?: string
}

class PDFExportService {
  private defaultBranding: FirmBranding = {
    name: 'Prima Facie - Legal Services',
    address: 'São Paulo, SP - Brasil',
    email: 'contato@primafacie.com.br',
    website: 'www.primafacie.com.br',
    primaryColor: '#1e40af'
  }

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

  private addHeader(doc: jsPDF, title: string, branding: FirmBranding = this.defaultBranding): number {
    const pageWidth = doc.internal.pageSize.getWidth()
    let currentY = 20

    // Logo (if available)
    if (branding.logo) {
      try {
        doc.addImage(branding.logo, 'PNG', 20, currentY, 30, 30)
      } catch (error) {
        console.warn('Failed to add logo:', error)
      }
    }

    // Firm name and info
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(branding.primaryColor || '#1e40af')
    doc.text(branding.name, branding.logo ? 60 : 20, currentY + 15)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#666666')
    
    if (branding.address) {
      doc.text(branding.address, branding.logo ? 60 : 20, currentY + 25)
    }
    
    const contactInfo = []
    if (branding.phone) contactInfo.push(branding.phone)
    if (branding.email) contactInfo.push(branding.email)
    if (branding.website) contactInfo.push(branding.website)
    
    if (contactInfo.length > 0) {
      doc.text(contactInfo.join(' | '), branding.logo ? 60 : 20, currentY + 32)
    }

    // Report title
    currentY += 60
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor('#000000')
    doc.text(title, 20, currentY)

    // Generated date
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#666666')
    doc.text(`Gerado em: ${this.formatDate(new Date())}`, pageWidth - 80, currentY)

    return currentY + 20
  }

  private addFooter(doc: jsPDF): void {
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#999999')
    
    doc.text('Este relatório foi gerado automaticamente pelo sistema Prima Facie', 20, pageHeight - 20)
    doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - 40, pageHeight - 20)
  }

  // ====================================
  // AGING REPORT PDF
  // ====================================

  async generateAgingReportPDF(agingReport: AgingReport, branding?: FirmBranding): Promise<Blob> {
    const doc = new jsPDF()
    let currentY = this.addHeader(doc, 'Relatório de Aging - Análise por Vencimento', branding)

    // Summary section
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo Executivo', 20, currentY)
    currentY += 15

    const summaryData = [
      ['Categoria', 'Valor'],
      ['Contas a Receber - Em Dia', this.formatCurrency(agingReport.receivables_current)],
      ['Contas a Receber - 1-30 dias', this.formatCurrency(agingReport.receivables_overdue_30)],
      ['Contas a Receber - 31-60 dias', this.formatCurrency(agingReport.receivables_overdue_60)],
      ['Contas a Receber - 61-90 dias', this.formatCurrency(agingReport.receivables_overdue_90)],
      ['Contas a Receber - 90+ dias', this.formatCurrency(agingReport.receivables_over_90)],
      ['TOTAL A RECEBER', this.formatCurrency(agingReport.receivables_total)],
      ['', ''],
      ['Contas a Pagar - Em Dia', this.formatCurrency(agingReport.payables_current)],
      ['Contas a Pagar - 1-30 dias', this.formatCurrency(agingReport.payables_overdue_30)],
      ['Contas a Pagar - 31-60 dias', this.formatCurrency(agingReport.payables_overdue_60)],
      ['Contas a Pagar - 61-90 dias', this.formatCurrency(agingReport.payables_overdue_90)],
      ['Contas a Pagar - 90+ dias', this.formatCurrency(agingReport.payables_over_90)],
      ['TOTAL A PAGAR', this.formatCurrency(agingReport.payables_total)],
      ['', ''],
      ['FLUXO LÍQUIDO', this.formatCurrency(agingReport.receivables_total - agingReport.payables_total)]
    ]

    doc.autoTable({
      startY: currentY,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 64, 175] },
      didDrawPage: () => this.addFooter(doc)
    })

    // Analysis section
    doc.addPage()
    currentY = this.addHeader(doc, 'Análise Detalhada', branding)

    const overduePct = agingReport.receivables_total > 0 
      ? ((agingReport.receivables_overdue_30 + agingReport.receivables_overdue_60 + 
          agingReport.receivables_overdue_90 + agingReport.receivables_over_90) / agingReport.receivables_total * 100).toFixed(1)
      : '0.0'

    const liquidityRatio = agingReport.payables_total > 0 
      ? (agingReport.receivables_total / agingReport.payables_total).toFixed(2)
      : '∞'

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    
    const analysisText = [
      `• Percentual de recebíveis em atraso: ${overduePct}%`,
      `• Índice de liquidez (Recebível/Pagável): ${liquidityRatio}x`,
      `• Margem de segurança: ${this.formatCurrency(agingReport.receivables_total - agingReport.payables_total)}`,
      '',
      'RECOMENDAÇÕES:',
      '• Intensificar cobrança de valores acima de 60 dias',
      '• Revisar política de crédito para novos clientes',
      '• Implementar desconto para pagamento antecipado',
      '• Renegociar prazos com fornecedores principais'
    ]

    analysisText.forEach((line, index) => {
      doc.text(line, 20, currentY + (index * 8))
    })

    this.addFooter(doc)
    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }

  // ====================================
  // COLLECTIONS REPORT PDF
  // ====================================

  async generateCollectionsReportPDF(collections: PaymentCollection[], branding?: FirmBranding): Promise<Blob> {
    const doc = new jsPDF()
    let currentY = this.addHeader(doc, 'Relatório de Cobrança - Contas a Receber', branding)

    // Summary stats
    const totalAmount = collections.reduce((sum, c) => sum + (c.invoice?.balance_due || 0), 0)
    const overdueCount = collections.filter(c => c.days_overdue > 0).length
    const disputedCount = collections.filter(c => c.is_disputed).length

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo:', 20, currentY)
    currentY += 10

    doc.setFont('helvetica', 'normal')
    doc.text(`Total de cobranças: ${collections.length}`, 20, currentY)
    doc.text(`Valor total: ${this.formatCurrency(totalAmount)}`, 20, currentY + 8)
    doc.text(`Cobranças em atraso: ${overdueCount}`, 20, currentY + 16)
    doc.text(`Cobranças contestadas: ${disputedCount}`, 20, currentY + 24)
    currentY += 40

    // Collections table
    const tableData = collections.map(collection => [
      collection.client?.name || '',
      collection.invoice?.invoice_number || '',
      this.formatCurrency(collection.invoice?.balance_due || 0),
      collection.days_overdue.toString(),
      this.getCollectionStatusLabel(collection.collection_status),
      (collection.reminder_count || 0).toString()
    ])

    doc.autoTable({
      startY: currentY,
      head: [['Cliente', 'Fatura', 'Valor', 'Dias Atraso', 'Status', 'Lembretes']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'center' },
        5: { halign: 'center' }
      },
      didDrawPage: () => this.addFooter(doc)
    })

    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }

  // ====================================
  // BILLS REPORT PDF
  // ====================================

  async generateBillsReportPDF(bills: Bill[], branding?: FirmBranding): Promise<Blob> {
    const doc = new jsPDF()
    let currentY = this.addHeader(doc, 'Relatório de Contas a Pagar', branding)

    // Summary stats
    const totalAmount = bills.reduce((sum, b) => sum + b.balance_due, 0)
    const pendingCount = bills.filter(b => b.payment_status === 'pending').length
    const overdueCount = bills.filter(b => {
      const daysOverdue = Math.floor((new Date().getTime() - new Date(b.due_date).getTime()) / (1000 * 3600 * 24))
      return daysOverdue > 0 && b.payment_status !== 'paid'
    }).length

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo:', 20, currentY)
    currentY += 10

    doc.setFont('helvetica', 'normal')
    doc.text(`Total de faturas: ${bills.length}`, 20, currentY)
    doc.text(`Valor total: ${this.formatCurrency(totalAmount)}`, 20, currentY + 8)
    doc.text(`Faturas pendentes: ${pendingCount}`, 20, currentY + 16)
    doc.text(`Faturas em atraso: ${overdueCount}`, 20, currentY + 24)
    currentY += 40

    // Bills table
    const tableData = bills.map(bill => {
      const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(bill.due_date).getTime()) / (1000 * 3600 * 24)))
      
      return [
        bill.vendor?.name || '',
        bill.bill_number,
        this.formatCurrency(bill.balance_due),
        this.formatDate(bill.due_date),
        daysOverdue.toString(),
        this.getPaymentStatusLabel(bill.payment_status)
      ]
    })

    doc.autoTable({
      startY: currentY,
      head: [['Fornecedor', 'Número', 'Valor', 'Vencimento', 'Dias Atraso', 'Status']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'center' },
        4: { halign: 'center' }
      },
      didDrawPage: () => this.addFooter(doc)
    })

    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }

  // ====================================
  // VENDOR DIRECTORY PDF
  // ====================================

  async generateVendorDirectoryPDF(vendors: Vendor[], branding?: FirmBranding): Promise<Blob> {
    const doc = new jsPDF()
    let currentY = this.addHeader(doc, 'Diretório de Fornecedores', branding)

    // Summary
    const activeCount = vendors.filter(v => v.is_active).length
    const typeCount = vendors.reduce((acc, v) => {
      acc[v.vendor_type] = (acc[v.vendor_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo:', 20, currentY)
    currentY += 10

    doc.setFont('helvetica', 'normal')
    doc.text(`Total de fornecedores: ${vendors.length}`, 20, currentY)
    doc.text(`Fornecedores ativos: ${activeCount}`, 20, currentY + 8)
    currentY += 24

    // Vendor table
    const tableData = vendors.map(vendor => [
      vendor.name,
      this.getVendorTypeLabel(vendor.vendor_type),
      vendor.cnpj || vendor.cpf || '',
      vendor.email || '',
      vendor.phone || '',
      vendor.is_active ? 'Ativo' : 'Inativo'
    ])

    doc.autoTable({
      startY: currentY,
      head: [['Nome', 'Tipo', 'CNPJ/CPF', 'E-mail', 'Telefone', 'Status']],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
      didDrawPage: () => this.addFooter(doc)
    })

    return new Blob([doc.output('blob')], { type: 'application/pdf' })
  }

  // ====================================
  // UTILITY METHODS
  // ====================================

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
  // PUBLIC DOWNLOAD METHOD
  // ====================================

  downloadPDFFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}

export const pdfExportService = new PDFExportService()