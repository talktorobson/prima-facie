'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Vendor,
  VENDOR_TYPE_OPTIONS
} from '@/lib/financial/types'
import { Search, Plus, Edit, Trash2, Phone, Mail, Building2, MapPin } from 'lucide-react'

interface VendorListProps {
  vendors: Vendor[]
  onCreateNew: () => void
  onEdit: (vendor: Vendor) => void
  onDelete: (vendorId: string) => void
  onSearch: (query: string) => void
  isLoading?: boolean
}

export function VendorList({
  vendors,
  onCreateNew,
  onEdit,
  onDelete,
  onSearch,
  isLoading = false
}: VendorListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [vendorTypeFilter, setVendorTypeFilter] = useState('')
  const [recurringFilter, setRecurringFilter] = useState('')

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch(query)
  }

  const filteredVendors = vendors.filter(vendor => {
    const matchesType = !vendorTypeFilter || vendor.vendor_type === vendorTypeFilter
    const matchesRecurring = !recurringFilter || 
      (recurringFilter === 'true' && vendor.is_recurring) ||
      (recurringFilter === 'false' && !vendor.is_recurring)
    
    return matchesType && matchesRecurring
  })

  const getVendorTypeLabel = (type: string) => {
    const option = VENDOR_TYPE_OPTIONS.find(opt => opt.value === type)
    return option ? option.label : type
  }

  const formatDocument = (vendor: Vendor) => {
    if (vendor.cnpj) return vendor.cnpj
    if (vendor.cpf) return vendor.cpf
    return 'Não informado'
  }

  const getVendorIcon = (type: string) => {
    switch (type) {
      case 'supplier':
        return <Building2 className="h-4 w-4" />
      case 'contractor':
        return <Phone className="h-4 w-4" />
      case 'service_provider':
        return <Building2 className="h-4 w-4" />
      case 'utility':
        return <MapPin className="h-4 w-4" />
      case 'government':
        return <Building2 className="h-4 w-4" />
      default:
        return <Building2 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600">
            Gerencie fornecedores e prestadores de serviços
          </p>
        </div>
        <Button onClick={onCreateNew} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Novo Fornecedor</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, CNPJ ou CPF..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={vendorTypeFilter} onValueChange={setVendorTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de fornecedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {VENDOR_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={recurringFilter} onValueChange={setRecurringFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Recorrência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="true">Recorrentes</SelectItem>
                <SelectItem value="false">Pontuais</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center justify-end">
              <p className="text-sm text-gray-600">
                {filteredVendors.length} de {vendors.length} fornecedores
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor List */}
      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Carregando fornecedores...</p>
        </div>
      ) : filteredVendors.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {vendors.length === 0 ? 'Nenhum fornecedor cadastrado' : 'Nenhum fornecedor encontrado'}
            </h3>
            <p className="text-gray-600 mb-4">
              {vendors.length === 0 
                ? 'Comece adicionando seu primeiro fornecedor'
                : 'Tente ajustar os filtros de busca'
              }
            </p>
            {vendors.length === 0 && (
              <Button onClick={onCreateNew}>
                Cadastrar Primeiro Fornecedor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getVendorIcon(vendor.vendor_type)}
                    <div>
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      {vendor.legal_name && vendor.legal_name !== vendor.name && (
                        <p className="text-sm text-gray-600">{vendor.legal_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(vendor)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(vendor.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {getVendorTypeLabel(vendor.vendor_type)}
                  </Badge>
                  {vendor.is_recurring && (
                    <Badge variant="default">Recorrente</Badge>
                  )}
                  {!vendor.is_active && (
                    <Badge variant="destructive">Inativo</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 className="h-4 w-4 mr-2" />
                    <span>{formatDocument(vendor)}</span>
                  </div>

                  {vendor.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}

                  {vendor.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}

                  {(vendor.address_city || vendor.address_state) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>
                        {vendor.address_city}
                        {vendor.address_city && vendor.address_state && ', '}
                        {vendor.address_state}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Prazo de pagamento:</span>
                    <span className="font-medium">
                      {vendor.payment_terms || 30} dias
                    </span>
                  </div>
                  
                  {vendor.tax_rate && vendor.tax_rate > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Taxa de retenção:</span>
                      <span className="font-medium">{vendor.tax_rate}%</span>
                    </div>
                  )}

                  {vendor.pix_key && (
                    <div className="flex items-center text-sm text-green-600 mt-1">
                      <span className="text-xs bg-green-100 px-2 py-1 rounded">PIX</span>
                      <span className="ml-2 text-gray-600">Disponível</span>
                    </div>
                  )}
                </div>

                {vendor.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {vendor.notes}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t text-xs text-gray-500">
                  Criado em {new Date(vendor.created_at).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}