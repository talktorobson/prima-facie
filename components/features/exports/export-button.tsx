'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Download,
  FileSpreadsheet,
  FileText,
  Settings,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import type { ExportOptions, ExportResult } from '@/lib/exports/types'

interface ExportButtonProps {
  data: any[]
  type: 'collections' | 'bills' | 'vendors' | 'aging'
  onExport: (options: ExportOptions) => Promise<ExportResult>
  disabled?: boolean
  className?: string
}

export function ExportButton({
  data,
  type,
  onExport,
  disabled = false,
  className = ''
}: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel')
  const [lastExport, setLastExport] = useState<ExportResult | null>(null)

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'collections': 'Contas a Receber',
      'bills': 'Contas a Pagar',
      'vendors': 'Fornecedores',
      'aging': 'Relatório de Aging'
    }
    return labels[type] || type
  }

  const getDefaultFilename = (type: string, format: string): string => {
    const typeNames: Record<string, string> = {
      'collections': 'contas-receber',
      'bills': 'contas-pagar',
      'vendors': 'fornecedores',
      'aging': 'relatorio-aging'
    }
    return `${typeNames[type] || type}_${new Date().toISOString().split('T')[0]}`
  }

  const handleExport = async (quickFormat?: 'excel' | 'pdf') => {
    const exportFormat = quickFormat || format
    setIsLoading(true)
    setLastExport(null)

    try {
      const options: ExportOptions = {
        format: exportFormat,
        filename: getDefaultFilename(type, exportFormat)
      }

      const result = await onExport(options)
      setLastExport(result)

      if (result.success && result.blob && result.filename) {
        // Trigger download
        const url = window.URL.createObjectURL(result.blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${result.filename}.${exportFormat === 'excel' ? 'xlsx' : 'pdf'}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      setShowOptions(false)
    } catch (error) {
      setLastExport({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (showOptions) {
    return (
      <Card className="w-80">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Exportar {getTypeLabel(type)}</span>
          </CardTitle>
          <CardDescription>
            Selecione o formato e configure as opções de exportação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Formato</label>
            <Select value={format} onValueChange={(value) => setFormat(value as 'excel' | 'pdf')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span>Excel (.xlsx)</span>
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    <span>PDF (.pdf)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Registros para exportar:</span>
              <Badge variant="outline">{data.length}</Badge>
            </div>
          </div>

          {lastExport && (
            <div className={`p-3 rounded-lg ${
              lastExport.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {lastExport.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${
                  lastExport.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {lastExport.success ? 'Exportação concluída com sucesso!' : lastExport.error}
                </span>
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowOptions(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            
            <Button 
              onClick={() => handleExport()}
              disabled={isLoading || data.length === 0}
              className="flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Exportando...' : 'Exportar'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Quick export buttons */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('excel')}
        disabled={disabled || isLoading || data.length === 0}
        className="flex items-center space-x-1"
      >
        {isLoading && format === 'excel' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
        )}
        <span>Excel</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('pdf')}
        disabled={disabled || isLoading || data.length === 0}
        className="flex items-center space-x-1"
      >
        {isLoading && format === 'pdf' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 text-red-600" />
        )}
        <span>PDF</span>
      </Button>

      {/* Advanced options button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowOptions(true)}
        disabled={disabled || data.length === 0}
        className="flex items-center space-x-1"
      >
        <Settings className="h-4 w-4" />
        <span>Opções</span>
      </Button>

      {/* Data count indicator */}
      {data.length > 0 && (
        <Badge variant="outline" className="text-xs">
          {data.length} {data.length === 1 ? 'registro' : 'registros'}
        </Badge>
      )}
    </div>
  )
}