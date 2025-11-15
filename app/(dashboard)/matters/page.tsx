'use client'

import { useState } from 'react'
import { useMatters } from '@/lib/queries/useMatters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Briefcase, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreateMatterDialog } from '@/components/matters/create-matter-dialog'

export default function MattersPage() {
  const { data: matters, isLoading, error } = useMatters()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando processos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <p>Erro ao carregar processos: {(error as Error).message}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeCount = matters?.filter(m => m.status === 'active').length || 0
  const closedCount = matters?.filter(m => m.status === 'closed').length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Processos</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todos os processos do escritório
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Processo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total de Processos</p>
                <p className="text-2xl font-bold">{matters?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Encerrados</p>
                <p className="text-2xl font-bold">{closedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matters Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Processos</CardTitle>
        </CardHeader>
        <CardContent>
          {matters && matters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Advogado</TableHead>
                  <TableHead>Criado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matters.map((matter) => (
                  <TableRow key={matter.id}>
                    <TableCell className="font-mono text-sm">
                      {matter.case_number || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">{matter.title}</TableCell>
                    <TableCell>{matter.matter_type?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        matter.status === 'active' ? 'bg-green-100 text-green-800' :
                        matter.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        matter.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {matter.status === 'active' ? 'Ativo' :
                         matter.status === 'closed' ? 'Encerrado' :
                         matter.status === 'on_hold' ? 'Em espera' :
                         matter.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {matter.assigned_lawyer?.full_name || 'Não atribuído'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(matter.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum processo encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece criando seu primeiro processo
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Processo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateMatterDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
}