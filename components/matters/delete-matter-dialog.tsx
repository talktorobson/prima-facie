'use client'

import { useState } from 'react'
import { useDeleteMatter } from '@/lib/queries/useMatters'
import type { Matter } from '@/types/database'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface DeleteMatterDialogProps {
  matter: Matter | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteMatterDialog({ matter, open, onOpenChange }: DeleteMatterDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteMatter = useDeleteMatter()

  const handleDelete = async () => {
    if (!matter) return

    setError(null)
    setIsDeleting(true)

    try {
      await deleteMatter.mutateAsync(matter.id)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir processo')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Excluir Processo
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Todos os dados relacionados a este processo serão permanentemente removidos.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-0">
          {matter && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-900 mb-1">
                {matter.title}
              </p>
              {matter.case_number && (
                <p className="text-sm text-gray-600">
                  Número: {matter.case_number}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3 mt-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mt-4">
            Tem certeza que deseja excluir este processo?
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
          >
            Excluir Processo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
