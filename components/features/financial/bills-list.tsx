'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Bill,
  Vendor
} from '@/lib/financial/types'
import { 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Building2
} from 'lucide-react'

interface BillsListProps {
  bills: Bill[]
  vendors: Vendor[]
  onCreateNew: () => void
  onEdit: (bill: Bill) => void
  onView: (bill: Bill) => void
  onPayment: (bill: Bill) => void
  onApprove: (billId: string) => void
  onReject: (billId: string) => void
  onSearch: (filters: any) => void
  isLoading?: boolean
}

export function BillsList({
  bills,
  vendors,
  onCreateNew,
  onEdit,
  onView,
  onPayment,
  onApprove,
  onReject,
  onSearch,
  isLoading = false
}: BillsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [vendorFilter, setVendorFilter] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [dueDateFilter, setDueDateFilter] = useState('')

  const handleFiltersChange = () => {
    onSearch({
      query: searchQuery,
      status: statusFilter,
      vendor_id: vendorFilter,
      approval_status: approvalFilter,
      due_date_filter: dueDateFilter
    })
  }

  const filteredBills = bills.filter(bill => {
    const matchesQuery = !searchQuery || 
      bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendor?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = !statusFilter || bill.payment_status === statusFilter
    const matchesVendor = !vendorFilter || bill.vendor_id === vendorFilter
    const matchesApproval = !approvalFilter || bill.approval_status === approvalFilter
    
    let matchesDueDate = true
    if (dueDateFilter) {
      const today = new Date()
      const dueDate = new Date(bill.due_date)
      
      switch (dueDateFilter) {
        case 'overdue':
          matchesDueDate = dueDate < today && bill.payment_status !== 'paid'
          break
        case 'due_today':
          matchesDueDate = dueDate.toDateString() === today.toDateString()
          break
        case 'due_week':
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          matchesDueDate = dueDate >= today && dueDate <= nextWeek
          break
        case 'due_month':
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
          matchesDueDate = dueDate >= today && dueDate <= nextMonth
          break
      }
    }
    
    return matchesQuery && matchesStatus && matchesVendor && matchesApproval && matchesDueDate
  })

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'partial':
        return 'Parcial'
      case 'paid':
        return 'Pago'
      case 'overdue':
        return 'Em Atraso'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const getApprovalStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Aprovado</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>
      case 'under_review':
        return <Badge variant="secondary">Em Análise</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  const getDaysOverdue = (dueDate: string): number => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getTotalSummary = () => {
    const total = filteredBills.reduce((sum, bill) => sum + bill.total_amount, 0)
    const paid = filteredBills.reduce((sum, bill) => sum + bill.amount_paid, 0)
    const pending = total - paid
    
    return { total, paid, pending }
  }

  const summary = getTotalSummary()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contas a Pagar</h1>
          <p className="text-gray-600">
            Gerencie faturas e pagamentos a fornecedores
          </p>
        </div>
        <Button onClick={onCreateNew} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nova Fatura</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.total)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pago</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.paid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Aberto</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.pending)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar fatura..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="partial">Parcial</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Aprovação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="under_review">Em Análise</SelectItem>
              </SelectContent>
            </Select>

            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Vencimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
                <SelectItem value="due_today">Vence Hoje</SelectItem>
                <SelectItem value="due_week">Próximos 7 dias</SelectItem>
                <SelectItem value="due_month">Próximos 30 dias</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-end">
              <p className="text-sm text-gray-600">
                {filteredBills.length} de {bills.length} faturas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando faturas...</p>
        </div>
      ) : filteredBills.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {bills.length === 0 ? 'Nenhuma fatura cadastrada' : 'Nenhuma fatura encontrada'}
            </h3>
            <p className="text-gray-600 mb-4">
              {bills.length === 0 
                ? 'Comece adicionando sua primeira fatura'
                : 'Tente ajustar os filtros de busca'
              }
            </p>
            {bills.length === 0 && (
              <Button onClick={onCreateNew}>
                Cadastrar Primeira Fatura
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBills.map((bill) => {
            const isOverdue = new Date(bill.due_date) < new Date() && bill.payment_status !== 'paid'
            const daysOverdue = isOverdue ? getDaysOverdue(bill.due_date) : 0

            return (
              <Card key={bill.id} className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold">{bill.bill_number}</h3>
                            {getStatusIcon(bill.payment_status)}
                            <Badge variant={bill.payment_status === 'overdue' ? 'destructive' : 'secondary'}>
                              {getStatusLabel(bill.payment_status)}
                            </Badge>
                            {getApprovalStatusBadge(bill.approval_status)}
                            {bill.bill_type === 'recurring' && (
                              <Badge variant="outline">Recorrente</Badge>
                            )}
                            {bill.bill_type === 'installment' && (
                              <Badge variant="outline">
                                {bill.installment_number}/{bill.installment_total}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <Building2 className="h-4 w-4 mr-1" />
                            <span>{bill.vendor?.name}</span>
                            <span className="mx-2">•</span>
                            <span>{bill.expense_category?.name}</span>
                          </div>

                          {bill.description && (
                            <p className="text-sm text-gray-600 mt-1">{bill.description}</p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold">{formatCurrency(bill.total_amount)}</p>
                          {bill.balance_due > 0 && (
                            <p className="text-sm text-red-600">
                              Saldo: {formatCurrency(bill.balance_due)}
                            </p>
                          )}
                          {bill.amount_paid > 0 && (
                            <p className="text-sm text-green-600">
                              Pago: {formatCurrency(bill.amount_paid)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>Vence: {new Date(bill.due_date).toLocaleDateString('pt-BR')}</span>
                            {isOverdue && (
                              <span className="ml-2 text-red-600 font-medium">
                                ({daysOverdue} dias de atraso)
                              </span>
                            )}
                          </div>
                          
                          {bill.matter && (
                            <div>
                              <span>Caso: {bill.matter.title}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          {bill.approval_status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onApprove(bill.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                Aprovar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onReject(bill.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Rejeitar
                              </Button>
                            </>
                          )}
                          
                          {bill.approval_status === 'approved' && bill.balance_due > 0 && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => onPayment(bill)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pagar
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(bill)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(bill)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}