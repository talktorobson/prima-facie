'use client'

import { useState, useEffect } from 'react'
import { useUpdateFirm } from '@/lib/queries/usePlatform'
import { X } from 'lucide-react'
import type { LawFirm } from '@/types/database'

interface EditFirmDialogProps {
  open: boolean
  firm: LawFirm | null
  onClose: () => void
}

export function EditFirmDialog({ open, firm, onClose }: EditFirmDialogProps) {
  const updateFirm = useUpdateFirm()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    legal_name: '',
    cnpj: '',
    oab_number: '',
    phone: '',
    plan_type: 'trial',
    subscription_active: true,
  })

  useEffect(() => {
    if (firm) {
      setFormData({
        name: firm.name || '',
        email: firm.email || '',
        legal_name: firm.legal_name || '',
        cnpj: firm.cnpj || '',
        oab_number: firm.oab_number || '',
        phone: firm.phone || '',
        plan_type: firm.plan_type || 'trial',
        subscription_active: firm.subscription_active !== false,
      })
    }
  }, [firm])

  if (!open || !firm) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateFirm.mutateAsync({ id: firm.id, updates: formData })
      onClose()
    } catch {
      // Error handled by mutation
    }
  }

  const update = (field: string, value: string | boolean) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Editar Escritório</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                required
                value={formData.name}
                onChange={(e) => update('name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
              <input
                value={formData.legal_name}
                onChange={(e) => update('legal_name', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input
                value={formData.cnpj}
                onChange={(e) => update('cnpj', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OAB</label>
              <input
                value={formData.oab_number}
                onChange={(e) => update('oab_number', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                value={formData.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plano</label>
              <select
                value={formData.plan_type}
                onChange={(e) => update('plan_type', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="trial">Trial</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.subscription_active}
                  onChange={(e) => update('subscription_active', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Assinatura Ativa</span>
              </label>
            </div>
          </div>

          {updateFirm.error && (
            <p className="text-sm text-red-600">{(updateFirm.error as Error).message}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateFirm.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {updateFirm.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
