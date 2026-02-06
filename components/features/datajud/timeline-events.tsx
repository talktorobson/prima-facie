'use client'

// =====================================================
// DataJud Timeline Events Component
// Display and manage court timeline events
// =====================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Filter,
  Gavel,
  FileText,
  Users,
  ArrowRight
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface TimelineEvent {
  id: string
  movement_id: string
  movement_code: number
  movement_name: string
  movement_complement?: string
  event_datetime: string
  responsible_type_name?: string
  responsible_name?: string
  event_category: string
  priority_level: 'low' | 'normal' | 'high' | 'critical'
  is_relevant: boolean
  is_visible_client: boolean
  is_visible_timeline: boolean
  custom_description?: string
}

interface DataJudTimelineEventsProps {
  caseId: string
  showClientView?: boolean
  maxHeight?: string
  onEventToggle?: (eventId: string, field: string, value: boolean) => void
}

export function DataJudTimelineEvents({
  caseId,
  showClientView = false,
  maxHeight = "400px",
  onEventToggle
}: DataJudTimelineEventsProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{
    category: string | null
    priority: string | null
    relevantOnly: boolean
  }>({
    category: null,
    priority: null,
    relevantOnly: true
  })

  useEffect(() => {
    loadTimelineEvents()
  }, [caseId, filter])

  const loadTimelineEvents = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        relevant_only: filter.relevantOnly.toString(),
        client_view: showClientView.toString()
      })
      
      if (filter.category) params.append('category', filter.category)
      if (filter.priority) params.append('priority', filter.priority)

      const response = await fetch(`/api/datajud/timeline-events/${caseId}?${params}`)
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Failed to load timeline events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEventToggle = async (eventId: string, field: string, value: boolean) => {
    try {
      const response = await fetch(`/api/datajud/timeline-events/update/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [field]: value })
      })

      if (response.ok) {
        setEvents(prev => prev.map(event => 
          event.id === eventId ? { ...event, [field]: value } : event
        ))
        onEventToggle?.(eventId, field, value)
      }
    } catch (error) {
      console.error('Failed to update event:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'normal': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'critical': return 'Crítico'
      case 'high': return 'Alto'
      case 'normal': return 'Normal'
      default: return 'Baixo'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'decision': return <Gavel className="h-4 w-4" />
      case 'hearing': return <Users className="h-4 w-4" />
      case 'filing': return <FileText className="h-4 w-4" />
      case 'appeal': return <ArrowRight className="h-4 w-4" />
      case 'notification': return <AlertCircle className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'decision': return 'Decisão'
      case 'hearing': return 'Audiência'
      case 'filing': return 'Petição'
      case 'appeal': return 'Recurso'
      case 'notification': return 'Intimação'
      default: return 'Geral'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'decision': return 'bg-purple-100 text-purple-800'
      case 'hearing': return 'bg-blue-100 text-blue-800'
      case 'filing': return 'bg-green-100 text-green-800'
      case 'appeal': return 'bg-yellow-100 text-yellow-800'
      case 'notification': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredEvents = events.filter(event => {
    if (showClientView && !event.is_visible_client) return false
    if (!event.is_visible_timeline) return false
    if (filter.relevantOnly && !event.is_relevant) return false
    if (filter.category && event.event_category !== filter.category) return false
    if (filter.priority && event.priority_level !== filter.priority) return false
    return true
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 animate-spin" />
            <p className="text-sm text-muted-foreground">Carregando eventos...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {!showClientView && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filter.relevantOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(prev => ({ ...prev, relevantOnly: !prev.relevantOnly }))}
              >
                Apenas Relevantes
              </Button>
              
              <Button
                variant={filter.category === 'decision' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(prev => ({ 
                  ...prev, 
                  category: prev.category === 'decision' ? null : 'decision' 
                }))}
              >
                Decisões
              </Button>
              
              <Button
                variant={filter.category === 'hearing' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(prev => ({ 
                  ...prev, 
                  category: prev.category === 'hearing' ? null : 'hearing' 
                }))}
              >
                Audiências
              </Button>
              
              <Button
                variant={filter.priority === 'critical' ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(prev => ({ 
                  ...prev, 
                  priority: prev.priority === 'critical' ? null : 'critical' 
                }))}
              >
                Críticos
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Movimentações Processuais
            <Badge variant="secondary">{filteredEvents.length}</Badge>
          </CardTitle>
          <CardDescription>
            Eventos sincronizados do sistema DataJud CNJ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea style={{ height: maxHeight }}>
            {filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map((event, index) => (
                  <div key={event.id}>
                    <div className="flex gap-4">
                      {/* Timeline Line */}
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(event.priority_level)} flex-shrink-0`} />
                        {index < filteredEvents.length - 1 && (
                          <div className="w-px h-12 bg-border mt-2" />
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="flex-1 min-w-0 pb-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getCategoryColor(event.event_category)}>
                              <span className="flex items-center gap-1">
                                {getCategoryIcon(event.event_category)}
                                {getCategoryText(event.event_category)}
                              </span>
                            </Badge>
                            <Badge className={getPriorityColor(event.priority_level)}>
                              {getPriorityText(event.priority_level)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              #{event.movement_code}
                            </span>
                          </div>
                          
                          <div className="text-sm text-muted-foreground whitespace-nowrap">
                            {format(new Date(event.event_datetime), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm leading-5">
                            {event.custom_description || event.movement_name}
                          </h4>
                          
                          {event.movement_complement && (
                            <p className="text-sm text-muted-foreground">
                              {event.movement_complement}
                            </p>
                          )}
                          
                          {event.responsible_name && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Responsável:</span> {event.responsible_name}
                              {event.responsible_type_name && ` (${event.responsible_type_name})`}
                            </p>
                          )}
                        </div>

                        {/* Admin Controls */}
                        {!showClientView && (
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEventToggle(event.id, 'is_relevant', !event.is_relevant)}
                              className="h-6 px-2 text-xs"
                            >
                              {event.is_relevant ? (
                                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3 w-3 mr-1 text-gray-400" />
                              )}
                              Relevante
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEventToggle(event.id, 'is_visible_client', !event.is_visible_client)}
                              className="h-6 px-2 text-xs"
                            >
                              {event.is_visible_client ? (
                                <Eye className="h-3 w-3 mr-1 text-blue-500" />
                              ) : (
                                <EyeOff className="h-3 w-3 mr-1 text-gray-400" />
                              )}
                              Cliente
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEventToggle(event.id, 'is_visible_timeline', !event.is_visible_timeline)}
                              className="h-6 px-2 text-xs"
                            >
                              {event.is_visible_timeline ? (
                                <Eye className="h-3 w-3 mr-1 text-purple-500" />
                              ) : (
                                <EyeOff className="h-3 w-3 mr-1 text-gray-400" />
                              )}
                              Timeline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum evento encontrado com os filtros aplicados
                </p>
                {filter.relevantOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setFilter(prev => ({ ...prev, relevantOnly: false }))}
                  >
                    Mostrar Todos os Eventos
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Event Summary */}
      {events.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {events.filter(e => e.priority_level === 'critical').length}
                </p>
                <p className="text-xs text-muted-foreground">Críticos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {events.filter(e => e.priority_level === 'high').length}
                </p>
                <p className="text-xs text-muted-foreground">Alta Prioridade</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {events.filter(e => e.event_category === 'decision').length}
                </p>
                <p className="text-xs text-muted-foreground">Decisões</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {events.filter(e => e.event_category === 'hearing').length}
                </p>
                <p className="text-xs text-muted-foreground">Audiências</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}