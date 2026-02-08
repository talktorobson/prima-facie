'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useLawFirm, useUpdateLawFirm } from '@/lib/queries/useSettings'
import { useToast } from '@/components/ui/toast-provider'
import { useState, useEffect } from 'react'
import {
  BuildingOfficeIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function LawFirmSettingsPage() {
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const toast = useToast()
  const { data: lawFirm, isLoading } = useLawFirm(effectiveLawFirmId ?? undefined)
  const updateLawFirm = useUpdateLawFirm()

  const [name, setName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [oabNumber, setOabNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [addressStreet, setAddressStreet] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [addressComplement, setAddressComplement] = useState('')
  const [addressNeighborhood, setAddressNeighborhood] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressState, setAddressState] = useState('')
  const [addressZipcode, setAddressZipcode] = useState('')

  useEffect(() => {
    if (lawFirm) {
      setName(lawFirm.name || '')
      setLegalName(lawFirm.legal_name || '')
      setCnpj(lawFirm.cnpj || '')
      setOabNumber(lawFirm.oab_number || '')
      setEmail(lawFirm.email || '')
      setPhone(lawFirm.phone || '')
      setWebsite(lawFirm.website || '')
      setAddressStreet(lawFirm.address_street || '')
      setAddressNumber(lawFirm.address_number || '')
      setAddressComplement(lawFirm.address_complement || '')
      setAddressNeighborhood(lawFirm.address_neighborhood || '')
      setAddressCity(lawFirm.address_city || '')
      setAddressState(lawFirm.address_state || '')
      setAddressZipcode(lawFirm.address_zipcode || '')
    }
  }, [lawFirm])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveLawFirmId) return

    updateLawFirm.mutate(
      {
        id: effectiveLawFirmId,
        updates: {
          name, legal_name: legalName, cnpj, oab_number: oabNumber, email, phone, website,
          address_street: addressStreet, address_number: addressNumber, address_complement: addressComplement,
          address_neighborhood: addressNeighborhood, address_city: addressCity, address_state: addressState, address_zipcode: addressZipcode,
        },
      },
      {
        onSuccess: () => { toast.success('Alteracoes salvas com sucesso!') },
        onError: () => { toast.error('Erro ao salvar alteracoes.') },
      }
    )
  }

  const brazilianStates = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ]

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  if (isLoading) {
    return (
      <AdminOnly>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminOnly>
    )
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
              <ArrowLeftIcon className="h-5 w-5 mr-1" />Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuracoes do Escritorio</h1>
              <p className="text-gray-600">Gerencie as informacoes basicas do escritorio</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Informacoes Basicas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Escritorio *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className={inputCls} placeholder="Davila Reis Advocacia" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Razao Social</label>
                <input type="text" value={legalName} onChange={e => setLegalName(e.target.value)} className={inputCls} placeholder="Davila Reis Advocacia LTDA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ</label>
                <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)} className={inputCls} placeholder="12.345.678/0001-90" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numero OAB</label>
                <input type="text" value={oabNumber} onChange={e => setOabNumber(e.target.value)} className={inputCls} placeholder="OAB/SP 123456" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <PhoneIcon className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Informacoes de Contato</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <EnvelopeIcon className="h-4 w-4 inline mr-1" />Email Principal *
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="contato@escritorio.com.br" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <PhoneIcon className="h-4 w-4 inline mr-1" />Telefone
                </label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} placeholder="(11) 3456-7890" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GlobeAltIcon className="h-4 w-4 inline mr-1" />Website
                </label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className={inputCls} placeholder="https://www.escritorio.com.br" />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <MapPinIcon className="h-6 w-6 text-purple-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Endereco</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">Logradouro</label>
                <input type="text" value={addressStreet} onChange={e => setAddressStreet(e.target.value)} className={inputCls} placeholder="Rua das Palmeiras" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Numero</label>
                <input type="text" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} className={inputCls} placeholder="123" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                <input type="text" value={addressZipcode} onChange={e => setAddressZipcode(e.target.value)} className={inputCls} placeholder="01234-567" />
              </div>
              <div className="md:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Complemento</label>
                <input type="text" value={addressComplement} onChange={e => setAddressComplement(e.target.value)} className={inputCls} placeholder="Sala 1401" />
              </div>
              <div className="md:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                <input type="text" value={addressNeighborhood} onChange={e => setAddressNeighborhood(e.target.value)} className={inputCls} placeholder="Centro" />
              </div>
              <div className="md:col-span-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                <input type="text" value={addressCity} onChange={e => setAddressCity(e.target.value)} className={inputCls} placeholder="Sao Paulo" />
              </div>
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select value={addressState} onChange={e => setAddressState(e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {brazilianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button type="submit" disabled={updateLawFirm.isPending} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
              {updateLawFirm.isPending ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Salvando...</>
              ) : (
                'Salvar Alteracoes'
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminOnly>
  )
}
