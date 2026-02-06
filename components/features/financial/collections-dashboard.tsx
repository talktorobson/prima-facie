'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  PaymentCollection,
  COLLECTION_STATUS_OPTIONS
} from '@/lib/financial/types'
import { 
  Search,
  Clock,
  AlertTriangle,
  DollarSign,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Banknote,
  Filter
} from 'lucide-react'
import { ExportButton } from '@/components/features/exports/export-button'
import { exportService } from '@/lib/exports/export-service'
import type { ExportOptions, ExportResult } from '@/lib/exports/types'

interface CollectionsDashboardProps {
  collections: PaymentCollection[]
  lawFirmId: string
  onUpdateCollection: (collectionId: string, data: Partial<PaymentCollection>) => void
  onCreateReminder: (collectionId: string) => void
  onMarkDisputed: (collectionId: string, reason: string) => void
  onWriteOff: (collectionId: string, reason: string, amount: number) => void
  onPromiseToPay: (collectionId: string, date: string, amount: number, notes: string) => void
  isLoading?: boolean
}

export function CollectionsDashboard({
  collections,
  lawFirmId,
  onUpdateCollection,
  onCreateReminder,
  onMarkDisputed,
  onWriteOff,
  onPromiseToPay,
  isLoading = false
}: CollectionsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<PaymentCollection | null>(null)
  const [showPromiseForm, setShowPromiseForm] = useState(false)
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [showWriteOffForm, setShowWriteOffForm] = useState(false)

  // Form states
  const [promiseForm, setPromiseForm] = useState({
    date: '',
    amount: 0,
    notes: ''
  })
  const [disputeForm, setDisputeForm] = useState({
    reason: ''
  })
  const [writeOffForm, setWriteOffForm] = useState({
    reason: '',
    amount: 0
  })

  const filteredCollections = collections.filter(collection => {
    const matchesQuery = !searchQuery || 
      collection.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.invoice?.invoice_number?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = !statusFilter || collection.collection_status === statusFilter
    
    return matchesQuery && matchesStatus
  })

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <Badge variant="default">Em Dia</Badge>
      case 'overdue_30':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">30 dias</Badge>
      case 'overdue_60':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">60 dias</Badge>
      case 'overdue_90':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">90 dias</Badge>
      case 'in_collection':
        return <Badge variant="destructive">Em Cobrança</Badge>
      case 'written_off':
        return <Badge variant="outline">Baixado</Badge>
      case 'disputed':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Contestado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'current':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'overdue_30':
      case 'overdue_60':
      case 'overdue_90':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'in_collection':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'written_off':
        return <XCircle className="h-4 w-4 text-gray-600" />
      case 'disputed':
        return <MessageSquare className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getTotalSummary = () => {
    const totalAmount = filteredCollections.reduce((sum, c) => sum + (c.invoice?.total_amount || 0), 0)
    const overdueAmount = filteredCollections
      .filter(c => !['current', 'written_off'].includes(c.collection_status))
      .reduce((sum, c) => sum + (c.invoice?.balance_due || 0), 0)
    
    const collectionsByStatus = filteredCollections.reduce((acc, c) => {
      acc[c.collection_status] = (acc[c.collection_status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return { totalAmount, overdueAmount, collectionsByStatus }
  }

  const handlePromiseToPay = () => {
    if (selectedCollection && promiseForm.date && promiseForm.amount > 0) {
      onPromiseToPay(selectedCollection.id, promiseForm.date, promiseForm.amount, promiseForm.notes)
      setShowPromiseForm(false)
      setPromiseForm({ date: '', amount: 0, notes: '' })
      setSelectedCollection(null)
    }
  }

  const handleMarkDisputed = () => {
    if (selectedCollection && disputeForm.reason.trim()) {
      onMarkDisputed(selectedCollection.id, disputeForm.reason)
      setShowDisputeForm(false)
      setDisputeForm({ reason: '' })
      setSelectedCollection(null)
    }
  }

  const handleWriteOff = () => {
    if (selectedCollection && writeOffForm.reason.trim() && writeOffForm.amount > 0) {
      onWriteOff(selectedCollection.id, writeOffForm.reason, writeOffForm.amount)
      setShowWriteOffForm(false)
      setWriteOffForm({ reason: '', amount: 0 })
      setSelectedCollection(null)
    }
  }

  const handleExport = async (options: ExportOptions): Promise<ExportResult> => {
    const filters = {
      status: statusFilter || undefined,
      search: searchQuery || undefined
    }
    return await exportService.exportCollections(lawFirmId, { ...options, filters })
  }

  const summary = getTotalSummary()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobrança e Recebimento</h1>
          <p className="text-gray-600">
            Gerencie cobranças, acompanhe pagamentos em atraso e resolva disputas
          </p>
        </div>
        <ExportButton
          data={filteredCollections}
          type="collections"
          onExport={handleExport}
          disabled={isLoading}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total a Receber</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.overdueAmount)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Cobrança Ativa</p>
                <p className="text-2xl font-bold text-orange-600">
                  {summary.collectionsByStatus.in_collection || 0}
                </p>
              </div>
              <Phone className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contestados</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summary.collectionsByStatus.disputed || 0}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por cliente ou fatura..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status da cobrança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {COLLECTION_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center justify-end">
              <p className="text-sm text-gray-600">
                {filteredCollections.length} de {collections.length} cobranças
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collections List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando cobranças...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {collections.length === 0 ? 'Nenhuma cobrança pendente' : 'Nenhuma cobrança encontrada'}
            </h3>
            <p className="text-gray-600">
              {collections.length === 0 
                ? 'Todas as faturas estão em dia'
                : 'Tente ajustar os filtros de busca'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCollections.map((collection) => (
            <Card key={collection.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(collection.collection_status)}
                          <h3 className="text-lg font-semibold">{collection.client?.name}</h3>
                          {getStatusBadge(collection.collection_status)}
                          {collection.is_disputed && (
                            <Badge variant="outline" className="border-purple-500 text-purple-700">
                              Contestado
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <FileText className="h-4 w-4 mr-1" />
                          <span>Fatura: {collection.invoice?.invoice_number}</span>
                          <span className="mx-2">•</span>
                          <span>{collection.days_overdue} dias de atraso</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(collection.invoice?.total_amount || 0)}</p>
                        <p className="text-sm text-red-600">
                          Saldo: {formatCurrency(collection.invoice?.balance_due || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Collection Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">Última Cobrança</p>
                        <p className="text-gray-600">
                          {collection.last_reminder_sent 
                            ? new Date(collection.last_reminder_sent).toLocaleDateString('pt-BR')
                            : 'Nunca enviada'
                          }
                        </p>
                        <p className="text-gray-500">{collection.reminder_count} lembretes enviados</p>
                      </div>

                      {collection.promise_to_pay_date && (
                        <div>
                          <p className="font-medium text-gray-900">Promessa de Pagamento</p>
                          <p className="text-gray-600">
                            {new Date(collection.promise_to_pay_date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-green-600">
                            {formatCurrency(collection.promise_to_pay_amount || 0)}
                          </p>
                        </div>
                      )}

                      {collection.collection_agent_id && (
                        <div>
                          <p className="font-medium text-gray-900">Responsável</p>
                          <p className="text-gray-600">Agente de Cobrança</p>
                        </div>
                      )}
                    </div>

                    {/* Dispute Information */}
                    {collection.is_disputed && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="font-medium text-purple-900">Contestação</p>
                        <p className="text-sm text-purple-700">{collection.dispute_reason}</p>
                        {collection.dispute_date && (
                          <p className="text-xs text-purple-600 mt-1">
                            Contestado em {new Date(collection.dispute_date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Collection Notes */}
                    {collection.collection_notes && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{collection.collection_notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCreateReminder(collection.id)}
                          className="flex items-center space-x-1"
                        >
                          <Mail className="h-4 w-4" />
                          <span>Enviar Lembrete</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCollection(collection)
                            setPromiseForm({
                              date: '',
                              amount: collection.invoice?.balance_due || 0,
                              notes: ''
                            })
                            setShowPromiseForm(true)
                          }}
                          className="flex items-center space-x-1"
                        >
                          <Calendar className="h-4 w-4" />
                          <span>Promessa Pgto</span>
                        </Button>

                        {!collection.is_disputed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCollection(collection)
                              setShowDisputeForm(true)
                            }}
                            className="flex items-center space-x-1"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span>Marcar Disputa</span>
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCollection(collection)
                            setWriteOffForm({
                              reason: '',
                              amount: collection.invoice?.balance_due || 0
                            })
                            setShowWriteOffForm(true)
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Baixar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Promise to Pay Modal */}
      {showPromiseForm && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Promessa de Pagamento</CardTitle>
              <CardDescription>
                Registre uma promessa de pagamento do cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Prometida</label>
                <Input
                  type="date"
                  value={promiseForm.date}
                  onChange={(e) => setPromiseForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Prometido</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={promiseForm.amount || ''}
                    onChange={(e) => setPromiseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Observações</label>
                <Textarea
                  value={promiseForm.notes}
                  onChange={(e) => setPromiseForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Detalhes da conversa com o cliente..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPromiseForm(false)
                    setSelectedCollection(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handlePromiseToPay}>
                  Registrar Promessa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeForm && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Marcar como Contestado</CardTitle>
              <CardDescription>
                Registre os motivos da contestação pelo cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo da Contestação</label>
                <Textarea
                  value={disputeForm.reason}
                  onChange={(e) => setDisputeForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Descreva os motivos apresentados pelo cliente..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDisputeForm(false)
                    setSelectedCollection(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleMarkDisputed} variant="destructive">
                  Marcar Contestação
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Write Off Modal */}
      {showWriteOffForm && selectedCollection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Baixar Cobrança</CardTitle>
              <CardDescription>
                Registre a baixa da cobrança como perda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor a Baixar</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={writeOffForm.amount || ''}
                    onChange={(e) => setWriteOffForm(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo da Baixa</label>
                <Textarea
                  value={writeOffForm.reason}
                  onChange={(e) => setWriteOffForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Justifique o motivo da baixa..."
                  rows={3}
                />
              </div>

              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ Esta ação registrará uma perda contábil e não poderá ser desfeita.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWriteOffForm(false)
                    setSelectedCollection(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleWriteOff} variant="destructive">
                  Confirmar Baixa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}