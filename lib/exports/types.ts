// Export Service Types for Prima Facie
// Phase 8.10.4: Export & Reporting Engine

export interface ExportOptions {
  format: 'excel' | 'pdf'
  filename?: string
  filters?: Record<string, any>
  columns?: ExportColumn[]
  branding?: FirmBranding
}

export interface ExportColumn {
  key: string
  label: string
  type?: 'text' | 'currency' | 'date' | 'boolean' | 'number'
  width?: number
  align?: 'left' | 'center' | 'right'
}

export interface FirmBranding {
  name: string
  logo?: string // Base64 or URL
  address?: string
  phone?: string
  email?: string
  website?: string
  primaryColor?: string
  secondaryColor?: string
  footerText?: string
}

export interface ExportResult {
  success: boolean
  blob?: Blob
  filename?: string
  error?: string
}

export interface DashboardWidget {
  id: string
  title: string
  type: 'metric' | 'chart' | 'table' | 'gauge'
  size: 'small' | 'medium' | 'large'
  data: any
  config?: WidgetConfig
}

export interface WidgetConfig {
  showTrend?: boolean
  showPercentage?: boolean
  chartType?: 'line' | 'bar' | 'pie' | 'doughnut'
  colorScheme?: string[]
  refreshInterval?: number
  filters?: Record<string, any>
}

export interface FinancialMetrics {
  totalReceivables: number
  totalPayables: number
  netCashFlow: number
  overdueReceivables: number
  overduePayables: number
  currentRatio: number
  daysReceivableOutstanding: number
  daysPayableOutstanding: number
  collectionEfficiency: number
}

export interface CashFlowProjection {
  date: string
  inflow: number
  outflow: number
  netFlow: number
  cumulativeFlow: number
}

export interface AgingSummary {
  category: 'receivables' | 'payables'
  current: number
  overdue_30: number
  overdue_60: number
  overdue_90: number
  over_90: number
  total: number
  percentages: {
    current: number
    overdue_30: number
    overdue_60: number
    overdue_90: number
    over_90: number
  }
}

export interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'aging' | 'collections' | 'payables' | 'vendors' | 'custom'
  template: string
  variables: string[]
  defaultBranding?: FirmBranding
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ScheduledExport {
  id: string
  name: string
  reportType: string
  schedule: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  format: 'excel' | 'pdf' | 'both'
  recipients: string[]
  filters?: Record<string, any>
  lastRun?: string
  nextRun: string
  isActive: boolean
}

// Export service error types
export class ExportError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_DATA' | 'GENERATION_FAILED' | 'DOWNLOAD_FAILED' | 'BRANDING_ERROR'
  ) {
    super(message)
    this.name = 'ExportError'
  }
}

// Excel specific types
export interface ExcelSheet {
  name: string
  data: any[]
  columns?: ExportColumn[]
  styles?: ExcelStyles
}

export interface ExcelStyles {
  headerStyle?: {
    fillColor?: string
    fontColor?: string
    fontSize?: number
    bold?: boolean
  }
  cellStyle?: {
    fontSize?: number
    wrapText?: boolean
    alignment?: 'left' | 'center' | 'right'
  }
  columnWidths?: number[]
}

// PDF specific types
export interface PDFOptions {
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'a4' | 'letter' | 'legal'
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  fonts?: {
    normal: string
    bold: string
  }
  colors?: {
    primary: string
    secondary: string
    text: string
    background: string
  }
}

export interface PDFSection {
  type: 'header' | 'text' | 'table' | 'image' | 'pageBreak'
  content: any
  styles?: any
}

// Dashboard widget data types
export interface MetricWidgetData {
  value: number
  label: string
  trend?: number
  trendDirection?: 'up' | 'down' | 'neutral'
  format?: 'currency' | 'percentage' | 'number'
  comparison?: {
    value: number
    label: string
    period: string
  }
}

export interface ChartWidgetData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    fill?: boolean
  }[]
}

export interface TableWidgetData {
  headers: string[]
  rows: any[][]
  totalRows?: number
  pagination?: {
    page: number
    pageSize: number
    total: number
  }
}

export interface GaugeWidgetData {
  value: number
  min: number
  max: number
  target?: number
  label: string
  unit?: string
  segments?: {
    min: number
    max: number
    color: string
    label: string
  }[]
}