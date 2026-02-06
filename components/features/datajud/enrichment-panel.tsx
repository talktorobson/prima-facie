'use client'

// =====================================================
// DataJud Case Enrichment Panel
// UI component for case enrichment management
// =====================================================

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database, 
  FileText, 
  Users, 
  Calendar,
  Info,
  TrendingUp,
  Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface DataJudCaseDetail {
  id: string
  matter_id: string
  datajud_case_id: string
  numero_processo_cnj: string
  tribunal_alias: string
  court_name?: string
  enrichment_status: 'pending' | 'completed' | 'failed' | 'partial'
  enrichment_confidence: number
  last_enrichment_at: string
  data_conflicts?: any
  legal_subjects_count: number
  participants_count: number
  timeline_events_count: number
}

export interface EnrichmentStats {
  total_cases: number
  completed_enrichments: number
  pending_enrichments: number
  average_confidence: number
  completion_rate: number
}

interface DataJudEnrichmentPanelProps {
  caseId: string
  caseTitle: string
  processNumber?: string
  onEnrichmentComplete?: (result: any) => void
}

export function DataJudEnrichmentPanel({
  caseId,
  caseTitle,
  processNumber,
  onEnrichmentComplete
}: DataJudEnrichmentPanelProps) {
  const [enrichmentData, setEnrichmentData] = useState<DataJudCaseDetail | null>(null)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichmentResult, setEnrichmentResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<EnrichmentStats | null>(null)

  // Load existing enrichment data
  useEffect(() => {
    loadEnrichmentData()
    loadStats()
  }, [caseId])

  const loadEnrichmentData = async () => {
    try {
      // This would call your Supabase service to get enrichment data
      const response = await fetch(`/api/datajud/case-enrichment/${caseId}`)
      if (response.ok) {
        const data = await response.json()
        setEnrichmentData(data)
      }
    } catch (error) {
      console.error('Failed to load enrichment data:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/datajud/enrichment-stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleEnrichCase = async (options: any = {}) => {
    if (!processNumber) {
      setError('Número do processo é necessário para enriquecer com dados do DataJud')
      return
    }

    setIsEnriching(true)
    setError(null)
    setEnrichmentResult(null)

    try {
      const response = await fetch('/api/datajud/enrich-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          case_id: caseId,
          process_number: processNumber,
          options
        })
      })

      const result = await response.json()

      if (result.success) {
        setEnrichmentResult(result)
        await loadEnrichmentData()
        await loadStats()
        onEnrichmentComplete?.(result)
      } else {
        setError(result.errors?.join(', ') || 'Falha no enriquecimento')
      }
    } catch (error) {
      setError('Erro ao conectar com o serviço DataJud')
      console.error('Enrichment error:', error)
    } finally {
      setIsEnriching(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'partial': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completo'
      case 'partial': return 'Parcial'
      case 'failed': return 'Falhou'
      default: return 'Pendente'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Enriquecimento DataJud CNJ</h3>
          <p className="text-sm text-muted-foreground">
            Enriqueça dados do caso com informações oficiais do DataJud
          </p>
        </div>
        <Button
          onClick={() => handleEnrichCase({ force_update: true })}
          disabled={isEnriching || !processNumber}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isEnriching ? 'animate-spin' : ''}`} />
          {isEnriching ? 'Enriquecendo...' : 'Enriquecer Caso'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro no Enriquecimento</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {enrichmentResult && enrichmentResult.success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Enriquecimento Concluído</AlertTitle>
          <AlertDescription>
            Caso enriquecido com sucesso. {enrichmentResult.enriched_fields?.length || 0} campos atualizados,
            {enrichmentResult.timeline_events_added} eventos adicionados.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="participants">Participantes</TabsTrigger>
          <TabsTrigger value="conflicts">Conflitos</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Enrichment Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Status do Enriquecimento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrichmentData ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge className={getStatusColor(enrichmentData.enrichment_status)}>
                        {getStatusText(enrichmentData.enrichment_status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Confiança:</span>
                      <span className={`text-sm font-medium ${getConfidenceColor(enrichmentData.enrichment_confidence)}`}>
                        {(enrichmentData.enrichment_confidence * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Última Atualização:</span>
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(enrichmentData.last_enrichment_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          Assuntos Jurídicos
                        </span>
                        <span className="font-medium">{enrichmentData.legal_subjects_count}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          Participantes
                        </span>
                        <span className="font-medium">{enrichmentData.participants_count}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          Eventos Timeline
                        </span>
                        <span className="font-medium">{enrichmentData.timeline_events_count}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum enriquecimento encontrado para este caso
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Card */}
            {stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Estatísticas Gerais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de Casos:</span>
                    <span className="text-sm font-medium">{stats.total_cases}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Enriquecidos:</span>
                    <span className="text-sm font-medium">{stats.completed_enrichments}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Taxa de Conclusão</span>
                      <span className="font-medium">{stats.completion_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.completion_rate} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Confiança Média:</span>
                    <span className={`text-sm font-medium ${getConfidenceColor(stats.average_confidence)}`}>
                      {(stats.average_confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Process Information */}
          {processNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informações do Processo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Número CNJ:</span>
                    <p className="font-mono">{processNumber}</p>
                  </div>
                  {enrichmentData && (
                    <>
                      <div>
                        <span className="text-muted-foreground">Tribunal:</span>
                        <p>{enrichmentData.tribunal_alias}</p>
                      </div>
                      {enrichmentData.court_name && (
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Órgão Julgador:</span>
                          <p>{enrichmentData.court_name}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eventos da Timeline</CardTitle>
              <CardDescription>
                Movimentações processuais sincronizadas do DataJud
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {enrichmentData?.timeline_events_count > 0 ? (
                  <div className="space-y-2">
                    {/* Timeline events would be loaded here */}
                    <p className="text-sm text-muted-foreground">
                      {enrichmentData.timeline_events_count} eventos carregados
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum evento de timeline encontrado
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants Tab */}
        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Participantes do Processo</CardTitle>
              <CardDescription>
                Partes identificadas através do DataJud
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                {enrichmentData?.participants_count > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {enrichmentData.participants_count} participantes identificados
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum participante encontrado
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conflicts Tab */}
        <TabsContent value="conflicts">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conflitos de Dados</CardTitle>
              <CardDescription>
                Diferenças entre dados existentes e do DataJud
              </CardDescription>
            </CardHeader>
            <CardContent>
              {enrichmentData?.data_conflicts ? (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {enrichmentData.data_conflicts.conflicts?.map((conflict: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-sm">{conflict.field_name}</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div>
                            <span className="text-muted-foreground">Valor Atual:</span> {conflict.existing_value}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Valor DataJud:</span> {conflict.datajud_value}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ação:</span> {conflict.action_taken}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum conflito de dados detectado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEnrichCase({ include_timeline: true, include_participants: false, include_legal_subjects: false })}
              disabled={isEnriching}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Apenas Timeline
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEnrichCase({ include_timeline: false, include_participants: true, include_legal_subjects: false })}
              disabled={isEnriching}
            >
              <Users className="h-3 w-3 mr-1" />
              Apenas Participantes
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEnrichCase({ include_timeline: false, include_participants: false, include_legal_subjects: true })}
              disabled={isEnriching}
            >
              <FileText className="h-3 w-3 mr-1" />
              Apenas Assuntos
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEnrichCase({ force_update: true })}
              disabled={isEnriching}
            >
              <Zap className="h-3 w-3 mr-1" />
              Forçar Atualização
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}