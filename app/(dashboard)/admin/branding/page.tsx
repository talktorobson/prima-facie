'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useLawFirm, useUpdateLawFirm } from '@/lib/queries/useSettings'
import { useToast } from '@/components/ui/toast-provider'
import { useState, useEffect } from 'react'
import {
  SwatchIcon,
  PhotoIcon,
  ArrowLeftIcon,
  EyeIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function BrandingPage() {
  const { profile } = useAuthContext()
  const toast = useToast()
  const { data: lawFirm, isLoading } = useLawFirm(profile?.law_firm_id ?? undefined)
  const updateLawFirm = useUpdateLawFirm()
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const [primaryColor, setPrimaryColor] = useState('#0066CC')
  const [secondaryColor, setSecondaryColor] = useState('#64748B')
  const [logoUrl, setLogoUrl] = useState('')
  const [customDomain, setCustomDomain] = useState('')

  useEffect(() => {
    if (lawFirm) {
      setPrimaryColor(lawFirm.primary_color || '#0066CC')
      setSecondaryColor(lawFirm.secondary_color || '#64748B')
      setLogoUrl(lawFirm.logo_url || '')
      setCustomDomain(lawFirm.custom_domain || '')
    }
  }, [lawFirm])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.law_firm_id) return

    updateLawFirm.mutate(
      {
        id: profile.law_firm_id,
        updates: { primary_color: primaryColor, secondary_color: secondaryColor, logo_url: logoUrl, custom_domain: customDomain },
      },
      {
        onSuccess: () => { toast.success('Personalizacao salva com sucesso!') },
        onError: () => { toast.error('Erro ao salvar personalizacao.') },
      }
    )
  }

  const presetColors = [
    { name: 'Azul Profissional', primary: '#0066CC', secondary: '#64748B' },
    { name: 'Verde Advocacia', primary: '#059669', secondary: '#6B7280' },
    { name: 'Roxo Moderno', primary: '#7C3AED', secondary: '#6B7280' },
    { name: 'Vermelho Classico', primary: '#DC2626', secondary: '#6B7280' },
    { name: 'Dourado Elegante', primary: '#D97706', secondary: '#78716C' },
    { name: 'Azul Escuro', primary: '#1E40AF', secondary: '#64748B' },
  ]

  const applyPreset = (preset: { primary: string; secondary: string }) => {
    setPrimaryColor(preset.primary)
    setSecondaryColor(preset.secondary)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      toast.error('Por favor, selecione um arquivo PNG, SVG ou JPG')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O arquivo deve ter no maximo 2MB')
      return
    }

    setUploadingLogo(true)
    try {
      const url = URL.createObjectURL(file)
      setLogoUrl(url)
      toast.info('Logo carregada. Salve as alteracoes para confirmar.')
    } catch {
      toast.error('Erro ao carregar logo. Tente novamente.')
    } finally {
      setUploadingLogo(false)
    }
  }

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
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5 mr-1" />Voltar
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personalizacao</h1>
            <p className="text-gray-600">Configure a identidade visual do escritorio</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <PhotoIcon className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Logo do Escritorio</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload de Logo</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <span className="text-blue-600 font-medium">Clique para enviar</span>
                          <span className="text-gray-500"> ou arraste e solte</span>
                          <input id="logo-upload" type="file" className="sr-only" accept="image/png,image/svg+xml,image/jpeg,image/jpg" onChange={handleLogoUpload} disabled={uploadingLogo} />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, SVG ou JPG ate 2MB</p>
                      {uploadingLogo && (
                        <div className="mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto" />
                          <p className="text-xs text-gray-600 mt-1">Carregando...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">ou</span></div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">URL da Logo</label>
                    <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className={inputCls} placeholder="https://exemplo.com/logo.png" />
                    <p className="mt-1 text-sm text-gray-500">Recomendado: PNG ou SVG, maximo 200x60px</p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {logoUrl ? (
                      <div className="space-y-4">
                        <img src={logoUrl} alt="Logo preview" className="mx-auto max-h-16 max-w-48" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                        <p className="text-sm text-gray-600">Preview da logo</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600">Nenhuma logo configurada</p>
                          <p className="text-xs text-gray-500">Adicione uma URL acima para ver o preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Colors Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <SwatchIcon className="h-6 w-6 text-blue-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Cores do Sistema</h2>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primaria</label>
                      <div className="flex items-center space-x-3">
                        <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-10 border border-gray-300 rounded cursor-pointer" />
                        <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className={`flex-1 ${inputCls}`} placeholder="#0066CC" />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Usada em botoes, links e elementos principais</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundaria</label>
                      <div className="flex items-center space-x-3">
                        <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="w-12 h-10 border border-gray-300 rounded cursor-pointer" />
                        <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className={`flex-1 ${inputCls}`} placeholder="#64748B" />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Usada em textos secundarios e elementos de suporte</p>
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Presets de Cores</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {presetColors.map((preset, index) => (
                        <button key={index} type="button" onClick={() => applyPreset(preset)} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <div className="flex space-x-1">
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: preset.primary }} />
                            <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: preset.secondary }} />
                          </div>
                          <span className="text-xs text-gray-600">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Domain Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <EyeIcon className="h-6 w-6 text-indigo-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Dominio Personalizado</h2>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dominio Personalizado (Opcional)</label>
                  <input type="text" value={customDomain} onChange={e => setCustomDomain(e.target.value)} className={inputCls} placeholder="sistema.seuescritorio.com.br" />
                  <p className="mt-1 text-sm text-gray-500">Configure um dominio personalizado para sua instancia do Prima Facie</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button type="submit" disabled={updateLawFirm.isPending} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                  {updateLawFirm.isPending ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Salvando...</>
                  ) : (
                    'Salvar Personalizacao'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>

              {/* Header Preview */}
              <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: primaryColor }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo preview" className="h-8 max-w-32" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                ) : (
                  <div className="text-white font-semibold">{lawFirm?.name || 'Nome do Escritorio'}</div>
                )}
              </div>

              {/* Button Preview */}
              <div className="space-y-3">
                <button className="w-full py-2 px-4 rounded-lg text-white font-medium" style={{ backgroundColor: primaryColor }}>Botao Primario</button>
                <button className="w-full py-2 px-4 rounded-lg border text-white" style={{ backgroundColor: secondaryColor, borderColor: secondaryColor }}>Botao Secundario</button>
              </div>

              {/* Text Preview */}
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">Texto Principal</p>
                <p className="text-sm" style={{ color: secondaryColor }}>Texto secundario usando a cor secundaria</p>
              </div>

              {/* Domain Preview */}
              {customDomain && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700">Seu dominio:</p>
                  <p className="text-sm text-gray-900">https://{customDomain}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}
