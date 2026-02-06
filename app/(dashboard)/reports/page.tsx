'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { 
  DocumentArrowDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  FolderIcon,
  UsersIcon,
  CalendarIcon,
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  ChevronDownIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  PresentationChartLineIcon,
  TableCellsIcon,
  PrinterIcon
} from '@heroicons/react/24/outline'

interface ReportCategory {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  reports: Report[]
}

interface Report {
  id: string
  name: string
  description: string
  category_id: string
  template_type: 'financial' | 'operational' | 'legal' | 'management'
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'on_demand'
  last_generated?: string
  can_schedule: boolean
  sample_data: ReportData
}

interface ReportData {
  title: string
  period: string
  summary: {
    total_cases: number
    total_clients: number
    total_revenue: number
    billable_hours: number
    documents_created: number
    success_rate: number
  }
  charts?: {
    revenue_trend: number[]
    case_distribution: { label: string; value: number }[]
    time_distribution: { label: string; hours: number }[]
  }
  tables?: {
    top_clients: { name: string; revenue: number; cases: number }[]
    case_outcomes: { type: string; total: number; won: number; lost: number; pending: number }[]
    lawyer_performance: { name: string; cases: number; hours: number; revenue: number }[]
  }
}

export default function ReportsPage() {
  const { profile } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  // Report categories with sample data
  const [reportCategories, setReportCategories] = useState<ReportCategory[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])

  // Stats
  const [stats, setStats] = useState({
    totalReports: 0,
    generatedThisMonth: 0,
    scheduledReports: 0,
    favoriteReports: 0
  })

  useEffect(() => {
    fetchReports()
  }, [profile])

  useEffect(() => {
    filterReports()
  }, [searchTerm, categoryFilter, reportCategories])

  const fetchReports = async () => {
    if (!profile?.law_firm_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Sample report categories and reports
      const sampleCategories: ReportCategory[] = [
        {
          id: 'financial',
          name: 'Relatórios Financeiros',
          description: 'Análises de receita, faturamento e gestão financeira',
          icon: CurrencyDollarIcon,
          reports: [
            {
              id: 'revenue-analysis',
              name: 'Análise de Receita',
              description: 'Relatório detalhado de receitas por período, cliente e área jurídica',
              category_id: 'financial',
              template_type: 'financial',
              frequency: 'monthly',
              last_generated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              can_schedule: true,
              sample_data: {
                title: 'Análise de Receita - Janeiro 2025',
                period: '01/01/2025 - 31/01/2025',
                summary: {
                  total_cases: 23,
                  total_clients: 156,
                  total_revenue: 285000,
                  billable_hours: 164,
                  documents_created: 89,
                  success_rate: 78
                },
                charts: {
                  revenue_trend: [180000, 220000, 250000, 285000],
                  case_distribution: [
                    { label: 'Trabalhista', value: 45 },
                    { label: 'Civil', value: 30 },
                    { label: 'Empresarial', value: 25 }
                  ],
                  time_distribution: [
                    { label: 'Consultoria', hours: 45 },
                    { label: 'Processos', hours: 89 },
                    { label: 'Administrativo', hours: 30 }
                  ]
                },
                tables: {
                  top_clients: [
                    { name: 'Empresa ABC Ltda', revenue: 85000, cases: 5 },
                    { name: 'João Silva Santos', revenue: 45000, cases: 3 },
                    { name: 'Construtora Delta', revenue: 38000, cases: 2 }
                  ],
                  case_outcomes: [
                    { type: 'Trabalhista', total: 12, won: 9, lost: 2, pending: 1 },
                    { type: 'Civil', total: 8, won: 6, lost: 1, pending: 1 },
                    { type: 'Empresarial', total: 3, won: 2, lost: 0, pending: 1 }
                  ],
                  lawyer_performance: [
                    { name: 'Maria Advogada', cases: 12, hours: 85, revenue: 125000 },
                    { name: 'João Advogado', cases: 8, hours: 56, revenue: 95000 },
                    { name: 'Pedro Advogado', cases: 3, hours: 23, revenue: 65000 }
                  ]
                }
              }
            },
            {
              id: 'billing-summary',
              name: 'Resumo de Faturamento',
              description: 'Resumo das cobranças, recebimentos e inadimplência',
              category_id: 'financial',
              template_type: 'financial',
              frequency: 'weekly',
              last_generated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              can_schedule: true,
              sample_data: {
                title: 'Resumo de Faturamento - Semana 3/2025',
                period: '13/01/2025 - 19/01/2025',
                summary: {
                  total_cases: 23,
                  total_clients: 156,
                  total_revenue: 68000,
                  billable_hours: 42,
                  documents_created: 23,
                  success_rate: 92
                }
              }
            }
          ]
        },
        {
          id: 'operational',
          name: 'Relatórios Operacionais',
          description: 'Gestão de casos, tarefas e produtividade',
          icon: ChartBarIcon,
          reports: [
            {
              id: 'case-management',
              name: 'Gestão de Casos',
              description: 'Status dos casos, prazos e andamentos processuais',
              category_id: 'operational',
              template_type: 'operational',
              frequency: 'daily',
              last_generated: new Date().toISOString(),
              can_schedule: true,
              sample_data: {
                title: 'Gestão de Casos - Relatório Diário',
                period: '17/01/2025',
                summary: {
                  total_cases: 23,
                  total_clients: 156,
                  total_revenue: 285000,
                  billable_hours: 164,
                  documents_created: 89,
                  success_rate: 78
                }
              }
            },
            {
              id: 'productivity-analysis',
              name: 'Análise de Produtividade',
              description: 'Métricas de eficiência e performance da equipe',
              category_id: 'operational',
              template_type: 'operational',
              frequency: 'monthly',
              last_generated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              can_schedule: true,
              sample_data: {
                title: 'Análise de Produtividade - Janeiro 2025',
                period: '01/01/2025 - 31/01/2025',
                summary: {
                  total_cases: 23,
                  total_clients: 156,
                  total_revenue: 285000,
                  billable_hours: 164,
                  documents_created: 89,
                  success_rate: 78
                }
              }
            }
          ]
        },
        {
          id: 'legal',
          name: 'Relatórios Jurídicos',
          description: 'Análises jurídicas, precedentes e compliance',
          icon: DocumentIcon,
          reports: [
            {
              id: 'compliance-report',
              name: 'Relatório de Compliance',
              description: 'Conformidade com normas da OAB e legislação vigente',
              category_id: 'legal',
              template_type: 'legal',
              frequency: 'quarterly',
              last_generated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
              can_schedule: true,
              sample_data: {
                title: 'Relatório de Compliance - Q4 2024',
                period: '01/10/2024 - 31/12/2024',
                summary: {
                  total_cases: 67,
                  total_clients: 145,
                  total_revenue: 890000,
                  billable_hours: 485,
                  documents_created: 234,
                  success_rate: 85
                }
              }
            },
            {
              id: 'case-outcomes',
              name: 'Resultados Processuais',
              description: 'Análise de êxito em ações judiciais por área',
              category_id: 'legal',
              template_type: 'legal',
              frequency: 'quarterly',
              last_generated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              can_schedule: true,
              sample_data: {
                title: 'Resultados Processuais - Q1 2025',
                period: '01/01/2025 - 31/03/2025',
                summary: {
                  total_cases: 23,
                  total_clients: 156,
                  total_revenue: 285000,
                  billable_hours: 164,
                  documents_created: 89,
                  success_rate: 78
                }
              }
            }
          ]
        },
        {
          id: 'management',
          name: 'Relatórios Gerenciais',
          description: 'Dashboards executivos e análises estratégicas',
          icon: PresentationChartLineIcon,
          reports: [
            {
              id: 'executive-dashboard',
              name: 'Dashboard Executivo',
              description: 'Visão geral estratégica do escritório para tomada de decisões',
              category_id: 'management',
              template_type: 'management',
              frequency: 'monthly',
              last_generated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              can_schedule: true,
              sample_data: {
                title: 'Dashboard Executivo - Janeiro 2025',
                period: '01/01/2025 - 31/01/2025',
                summary: {
                  total_cases: 23,
                  total_clients: 156,
                  total_revenue: 285000,
                  billable_hours: 164,
                  documents_created: 89,
                  success_rate: 78
                }
              }
            },
            {
              id: 'client-satisfaction',
              name: 'Satisfação do Cliente',
              description: 'Métricas de satisfação e feedback dos clientes',
              category_id: 'management',
              template_type: 'management',
              frequency: 'quarterly',
              last_generated: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
              can_schedule: false,
              sample_data: {
                title: 'Satisfação do Cliente - Q4 2024',
                period: '01/10/2024 - 31/12/2024',
                summary: {
                  total_cases: 67,
                  total_clients: 145,
                  total_revenue: 890000,
                  billable_hours: 485,
                  documents_created: 234,
                  success_rate: 92
                }
              }
            }
          ]
        }
      ]

      setReportCategories(sampleCategories)
      
      // Calculate stats
      const allReports = sampleCategories.flatMap(cat => cat.reports)
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      
      setStats({
        totalReports: allReports.length,
        generatedThisMonth: allReports.filter(r => 
          r.last_generated && new Date(r.last_generated) >= monthStart
        ).length,
        scheduledReports: allReports.filter(r => r.can_schedule).length,
        favoriteReports: Math.floor(allReports.length * 0.3) // Mock favorite count
      })
      
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterReports = () => {
    const allReports = reportCategories.flatMap(cat => cat.reports)
    let filtered = allReports

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter) {
      filtered = filtered.filter(report => report.category_id === categoryFilter)
    }

    setFilteredReports(filtered)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }


  const getFrequencyLabel = (frequency: string) => {
    const labels = {
      daily: 'Diário',
      weekly: 'Semanal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
      on_demand: 'Sob Demanda'
    }
    return labels[frequency as keyof typeof labels] || frequency
  }

  const getTemplateIcon = (type: string) => {
    const icons = {
      financial: CurrencyDollarIcon,
      operational: ChartBarIcon,
      legal: DocumentIcon,
      management: PresentationChartLineIcon
    }
    return icons[type as keyof typeof icons] || DocumentIcon
  }

  const handlePreview = (report: Report) => {
    setSelectedReport(report)
    setShowPreviewModal(true)
  }

  // Helper function to generate report content from sample data
  const generateReportContent = (report: Report) => {
    const { sample_data } = report
    return {
      title: report.name,
      period: `${dateRange.start} - ${dateRange.end}`,
      summary: sample_data.summary,
      charts: sample_data.charts,
      tables: sample_data.tables
    }
  }

  // Helper function to convert data to CSV format
  const convertToCSV = (reportContent: any) => {
    const lines = []
    
    // Header
    lines.push(`"${reportContent.title}"`)
    lines.push(`"Período: ${reportContent.period}"`)
    lines.push('')
    
    // Summary section
    lines.push('"RESUMO EXECUTIVO"')
    lines.push(`"Total de Casos","${reportContent.summary.total_cases}"`)
    lines.push(`"Total de Clientes","${reportContent.summary.total_clients}"`)
    lines.push(`"Receita Total","R$ ${reportContent.summary.total_revenue.toLocaleString('pt-BR')}"`)
    lines.push(`"Horas Faturáveis","${reportContent.summary.billable_hours}"`)
    lines.push(`"Documentos Criados","${reportContent.summary.documents_created}"`)
    lines.push(`"Taxa de Sucesso","${reportContent.summary.success_rate}%"`)
    lines.push('')
    
    // Charts data
    if (reportContent.charts) {
      lines.push('"DADOS DOS GRÁFICOS"')
      lines.push('"Tendência de Receita (últimos 4 meses)"')
      reportContent.charts.revenue_trend.forEach((value: number, index: number) => {
        const months = ['Outubro', 'Novembro', 'Dezembro', 'Janeiro']
        lines.push(`"${months[index]}","R$ ${value.toLocaleString('pt-BR')}"`)
      })
      lines.push('')
      
      lines.push('"Distribuição de Casos por Área"')
      reportContent.charts.case_distribution.forEach((item: any) => {
        lines.push(`"${item.label}","${item.value}%"`)
      })
      lines.push('')
    }
    
    // Tables data
    if (reportContent.tables) {
      lines.push('"TOP CLIENTES"')
      lines.push('"Cliente","Receita","Casos"')
      reportContent.tables.top_clients.forEach((client: any) => {
        lines.push(`"${client.name}","R$ ${client.revenue.toLocaleString('pt-BR')}","${client.cases}"`)
      })
      lines.push('')
      
      if (reportContent.tables.case_outcomes) {
        lines.push('"RESULTADOS DOS CASOS"')
        lines.push('"Tipo","Total","Ganhos","Perdas","Pendentes"')
        reportContent.tables.case_outcomes.forEach((outcome: any) => {
          lines.push(`"${outcome.type}","${outcome.total}","${outcome.won}","${outcome.lost}","${outcome.pending}"`)
        })
        lines.push('')
      }
      
      if (reportContent.tables.lawyer_performance) {
        lines.push('"PERFORMANCE DOS ADVOGADOS"')
        lines.push('"Advogado","Casos","Horas","Receita"')
        reportContent.tables.lawyer_performance.forEach((lawyer: any) => {
          lines.push(`"${lawyer.name}","${lawyer.cases}","${lawyer.hours}","R$ ${lawyer.revenue.toLocaleString('pt-BR')}"`)
        })
      }
    }
    
    return lines.join('\n')
  }

  // Helper function to format data as PDF content (text format)
  const formatAsPDF = (report: Report, reportContent: any) => {
    const lines = []
    
    lines.push('='.repeat(60))
    lines.push(`RELATÓRIO: ${reportContent.title.toUpperCase()}`)
    lines.push(`Período: ${reportContent.period}`)
    lines.push(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`)
    lines.push('='.repeat(60))
    lines.push('')
    
    // Summary
    lines.push('RESUMO EXECUTIVO')
    lines.push('-'.repeat(20))
    lines.push(`Total de Casos: ${reportContent.summary.total_cases}`)
    lines.push(`Total de Clientes: ${reportContent.summary.total_clients}`)
    lines.push(`Receita Total: R$ ${reportContent.summary.total_revenue.toLocaleString('pt-BR')}`)
    lines.push(`Horas Faturáveis: ${reportContent.summary.billable_hours}`)
    lines.push(`Documentos Criados: ${reportContent.summary.documents_created}`)
    lines.push(`Taxa de Sucesso: ${reportContent.summary.success_rate}%`)
    lines.push('')
    
    // Charts
    if (reportContent.charts) {
      lines.push('TENDÊNCIA DE RECEITA (Últimos 4 meses)')
      lines.push('-'.repeat(35))
      const months = ['Outubro', 'Novembro', 'Dezembro', 'Janeiro']
      reportContent.charts.revenue_trend.forEach((value: number, index: number) => {
        lines.push(`${months[index]}: R$ ${value.toLocaleString('pt-BR')}`)
      })
      lines.push('')
      
      lines.push('DISTRIBUIÇÃO DE CASOS POR ÁREA')
      lines.push('-'.repeat(30))
      reportContent.charts.case_distribution.forEach((item: any) => {
        lines.push(`${item.label}: ${item.value}%`)
      })
      lines.push('')
    }
    
    // Tables
    if (reportContent.tables) {
      lines.push('TOP CLIENTES')
      lines.push('-'.repeat(15))
      reportContent.tables.top_clients.forEach((client: any, index: number) => {
        lines.push(`${index + 1}. ${client.name} - R$ ${client.revenue.toLocaleString('pt-BR')} (${client.cases} casos)`)
      })
      lines.push('')
      
      if (reportContent.tables.case_outcomes) {
        lines.push('RESULTADOS DOS CASOS')
        lines.push('-'.repeat(20))
        reportContent.tables.case_outcomes.forEach((outcome: any) => {
          lines.push(`${outcome.type}: ${outcome.total} total (${outcome.won} ganhos, ${outcome.lost} perdas, ${outcome.pending} pendentes)`)
        })
        lines.push('')
      }
      
      if (reportContent.tables.lawyer_performance) {
        lines.push('PERFORMANCE DOS ADVOGADOS')
        lines.push('-'.repeat(25))
        reportContent.tables.lawyer_performance.forEach((lawyer: any, index: number) => {
          lines.push(`${index + 1}. ${lawyer.name} - ${lawyer.cases} casos, ${lawyer.hours}h, R$ ${lawyer.revenue.toLocaleString('pt-BR')}`)
        })
        lines.push('')
      }
    }
    
    lines.push('='.repeat(60))
    lines.push('Relatório gerado pelo Sistema Prima Facie')
    lines.push('Dávila Reis Advocacia - São Paulo, SP')
    lines.push('='.repeat(60))
    
    return lines.join('\n')
  }

  const handleGenerate = async (report: Report, format: 'pdf' | 'excel' = 'pdf') => {
    setIsGenerating(true)
    
    try {
      // Generate actual report content based on sample data
      const reportContent = generateReportContent(report)
      
      let blob: Blob
      let fileExtension: string
      
      if (format === 'excel') {
        // Create Excel format (CSV for compatibility)
        const csvContent = convertToCSV(reportContent)
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        fileExtension = 'csv'
      } else {
        // Create PDF-like content (text format for demonstration)
        const pdfContent = formatAsPDF(report, reportContent)
        blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' })
        fileExtension = 'txt'
      }
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `${report.name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.${fileExtension}`
      
      // Trigger download
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      alert(`Relatório "${report.name}" gerado e baixado com sucesso!`)
      
      // Update last generated time
      setReportCategories(prev => 
        prev.map(cat => ({
          ...cat,
          reports: cat.reports.map(r => 
            r.id === report.id 
              ? { ...r, last_generated: new Date().toISOString() }
              : r
          )
        }))
      )
    } catch (error) {
      console.error('Report generation error:', error)
      alert('Erro ao gerar relatório. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (report: Report, format: 'pdf' | 'excel') => {
    handleGenerate(report, format)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="mt-2 text-gray-600">
            Relatórios e análises do escritório
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Período:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            />
            <span className="text-gray-500">até</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Relatórios
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Gerados Este Mês
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.generatedThisMonth}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Agendados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.scheduledReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Favoritos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.favoriteReports}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Buscar relatórios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
              Filtros
              <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">
                    Categoria
                  </label>
                  <select
                    id="category-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">Todas as Categorias</option>
                    {reportCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || categoryFilter) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setCategoryFilter('')
                    }}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Limpar todos os filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-700">
        Mostrando {filteredReports.length} de {reportCategories.flatMap(cat => cat.reports).length} relatórios
      </div>

      {/* Report Categories */}
      <div className="space-y-6">
        {reportCategories
          .filter(category => 
            !categoryFilter || category.id === categoryFilter
          )
          .map((category) => {
            const categoryReports = category.reports.filter(report =>
              !searchTerm || 
              report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              report.description.toLowerCase().includes(searchTerm.toLowerCase())
            )

            if (categoryReports.length === 0) return null

            return (
              <div key={category.id} className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <category.icon className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryReports.map((report) => {
                      const TemplateIcon = getTemplateIcon(report.template_type)
                      return (
                        <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <TemplateIcon className="h-8 w-8 text-gray-400 mt-1" />
                              <div className="flex-1">
                                <h4 className="text-base font-medium text-gray-900">{report.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                                
                                <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                                  <span>Frequência: {getFrequencyLabel(report.frequency)}</span>
                                  {report.last_generated && (
                                    <span>Último: {formatDate(report.last_generated)}</span>
                                  )}
                                  {report.can_schedule && (
                                    <span className="text-green-600">• Agendável</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handlePreview(report)}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <EyeIcon className="w-3 h-3 mr-1" />
                                Visualizar
                              </button>
                              
                              <button
                                onClick={() => handleGenerate(report)}
                                disabled={isGenerating}
                                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                              >
                                {isGenerating ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                                    Gerando...
                                  </>
                                ) : (
                                  <>
                                    <DocumentArrowDownIcon className="w-3 h-3 mr-1" />
                                    Gerar
                                  </>
                                )}
                              </button>
                            </div>
                            
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleDownload(report, 'pdf')}
                                className="inline-flex items-center p-1 text-gray-400 hover:text-gray-600"
                                title="Download PDF"
                              >
                                <DocumentIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownload(report, 'excel')}
                                className="inline-flex items-center p-1 text-gray-400 hover:text-gray-600"
                                title="Download Excel"
                              >
                                <TableCellsIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhum relatório encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter
              ? 'Tente ajustar os filtros de busca.'
              : 'Relatórios aparecerão aqui quando gerados.'}
          </p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-5 mx-auto p-5 border w-[900px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Preview: {selectedReport.name}
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Report Header */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-xl font-bold text-gray-900">{selectedReport.sample_data.title}</h4>
                <p className="text-gray-600">Período: {selectedReport.sample_data.period}</p>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedReport.sample_data.summary.total_cases}</div>
                  <div className="text-sm text-gray-600">Total de Casos</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{selectedReport.sample_data.summary.total_clients}</div>
                  <div className="text-sm text-gray-600">Clientes</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatCurrency(selectedReport.sample_data.summary.total_revenue)}</div>
                  <div className="text-sm text-gray-600">Receita Total</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{selectedReport.sample_data.summary.billable_hours}h</div>
                  <div className="text-sm text-gray-600">Horas Faturáveis</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{selectedReport.sample_data.summary.documents_created}</div>
                  <div className="text-sm text-gray-600">Documentos</div>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{selectedReport.sample_data.summary.success_rate}%</div>
                  <div className="text-sm text-gray-600">Taxa de Sucesso</div>
                </div>
              </div>

              {/* Charts Section */}
              {selectedReport.sample_data.charts && (
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900">Gráficos e Análises</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Revenue Trend Chart */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h6 className="font-medium text-gray-900 mb-3">Tendência de Receita</h6>
                      <div className="h-32 flex items-end space-x-2">
                        {selectedReport.sample_data.charts.revenue_trend.map((value, index) => (
                          <div key={index} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${(value / Math.max(...selectedReport.sample_data.charts!.revenue_trend)) * 100}%` }}>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Out</span>
                        <span>Nov</span>
                        <span>Dez</span>
                        <span>Jan</span>
                      </div>
                    </div>
                    
                    {/* Case Distribution */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h6 className="font-medium text-gray-900 mb-3">Distribuição de Casos</h6>
                      <div className="space-y-2">
                        {selectedReport.sample_data.charts.case_distribution.map((item, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">{item.label}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${item.value}%` }}></div>
                              </div>
                              <span className="text-sm font-medium">{item.value}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tables Section */}
              {selectedReport.sample_data.tables && (
                <div className="space-y-4">
                  <h5 className="text-lg font-medium text-gray-900">Tabelas Detalhadas</h5>
                  
                  {/* Top Clients Table */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h6 className="font-medium text-gray-900 mb-3">Top Clientes</h6>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Receita</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Casos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedReport.sample_data.tables.top_clients.map((client, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm text-gray-900">{client.name}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{formatCurrency(client.revenue)}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">{client.cases}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => handleDownload(selectedReport, 'pdf')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <DocumentIcon className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={() => handleDownload(selectedReport, 'excel')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <TableCellsIcon className="w-4 h-4 mr-2" />
                  Download Excel
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}