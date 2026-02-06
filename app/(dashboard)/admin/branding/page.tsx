'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useState, useEffect } from 'react'
import { 
  SwatchIcon,
  PhotoIcon,
  ArrowLeftIcon,
  CheckIcon,
  EyeIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface BrandingData {
  primary_color: string
  secondary_color: string
  logo_url: string
  custom_domain: string
}

export default function BrandingPage() {
  const { profile } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [formData, setFormData] = useState<BrandingData>({
    primary_color: '#0066CC',
    secondary_color: '#64748B',
    logo_url: '',
    custom_domain: ''
  })

  useEffect(() => {
    if (profile?.law_firm) {
      setFormData({
        primary_color: profile.law_firm.primary_color || '#0066CC',
        secondary_color: profile.law_firm.secondary_color || '#64748B',
        logo_url: profile.law_firm.logo_url || '',
        custom_domain: profile.law_firm.custom_domain || ''
      })
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving branding data:', error)
    } finally {
      setLoading(false)
    }
  }

  const presetColors = [
    { name: 'Azul Profissional', primary: '#0066CC', secondary: '#64748B' },
    { name: 'Verde Advocacia', primary: '#059669', secondary: '#6B7280' },
    { name: 'Roxo Moderno', primary: '#7C3AED', secondary: '#6B7280' },
    { name: 'Vermelho Clássico', primary: '#DC2626', secondary: '#6B7280' },
    { name: 'Dourado Elegante', primary: '#D97706', secondary: '#78716C' },
    { name: 'Azul Escuro', primary: '#1E40AF', secondary: '#64748B' }
  ]

  const applyPreset = (preset: { primary: string; secondary: string }) => {
    setFormData(prev => ({
      ...prev,
      primary_color: preset.primary,
      secondary_color: preset.secondary
    }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      alert('Por favor, selecione um arquivo PNG, SVG ou JPG')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 2MB')
      return
    }

    setUploadingLogo(true)
    
    try {
      // In real implementation, upload to storage service
      // For now, create a local preview URL
      const url = URL.createObjectURL(file)
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setFormData(prev => ({
        ...prev,
        logo_url: url
      }))
      
      alert('Logo carregada com sucesso! Salve as alterações para confirmar.')
    } catch (error) {
      console.error('Upload error:', error)
      alert('Erro ao carregar logo. Tente novamente.')
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin"
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Personalização</h1>
              <p className="text-gray-600">Configure a identidade visual do escritório</p>
            </div>
          </div>
          
          {saved && (
            <div className="flex items-center text-green-600 bg-green-50 px-4 py-2 rounded-lg">
              <CheckIcon className="h-5 w-5 mr-2" />
              Alterações salvas!
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center mb-6">
                  <PhotoIcon className="h-6 w-6 text-purple-600 mr-3" />
                  <h2 className="text-lg font-semibold text-gray-900">Logo do Escritório</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload de Logo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <CloudArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="mt-2">
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <span className="text-blue-600 font-medium">Clique para enviar</span>
                          <span className="text-gray-500"> ou arraste e solte</span>
                          <input
                            id="logo-upload"
                            type="file"
                            className="sr-only"
                            accept="image/png,image/svg+xml,image/jpeg,image/jpg"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, SVG ou JPG até 2MB
                      </p>
                      {uploadingLogo && (
                        <div className="mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="text-xs text-gray-600 mt-1">Carregando...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">ou</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da Logo
                    </label>
                    <input
                      type="url"
                      name="logo_url"
                      value={formData.logo_url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://exemplo.com/logo.png"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Recomendado: PNG ou SVG, máximo 200x60px
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {formData.logo_url ? (
                      <div className="space-y-4">
                        <img
                          src={formData.logo_url}
                          alt="Logo preview"
                          className="mx-auto max-h-16 max-w-48"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cor Primária
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          name="primary_color"
                          value={formData.primary_color}
                          onChange={handleInputChange}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          name="primary_color"
                          value={formData.primary_color}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="#0066CC"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Usada em botões, links e elementos principais
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cor Secundária
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          name="secondary_color"
                          value={formData.secondary_color}
                          onChange={handleInputChange}
                          className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          name="secondary_color"
                          value={formData.secondary_color}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="#64748B"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Usada em textos secundários e elementos de suporte
                      </p>
                    </div>
                  </div>

                  {/* Color Presets */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Presets de Cores</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {presetColors.map((preset, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => applyPreset(preset)}
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <div className="flex space-x-1">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: preset.secondary }}
                            />
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
                  <h2 className="text-lg font-semibold text-gray-900">Domínio Personalizado</h2>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domínio Personalizado (Opcional)
                  </label>
                  <input
                    type="text"
                    name="custom_domain"
                    value={formData.custom_domain}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="sistema.seuescritorio.com.br"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Configure um domínio personalizado para sua instância do Prima Facie
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    'Salvar Personalização'
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
              <div 
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: formData.primary_color }}
              >
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo preview"
                    className="h-8 max-w-32"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="text-white font-semibold">
                    {profile?.law_firm?.name || 'Nome do Escritório'}
                  </div>
                )}
              </div>

              {/* Button Preview */}
              <div className="space-y-3">
                <button
                  className="w-full py-2 px-4 rounded-lg text-white font-medium"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  Botão Primário
                </button>
                
                <button
                  className="w-full py-2 px-4 rounded-lg border text-white"
                  style={{ 
                    backgroundColor: formData.secondary_color,
                    borderColor: formData.secondary_color
                  }}
                >
                  Botão Secundário
                </button>
              </div>

              {/* Text Preview */}
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">Texto Principal</p>
                <p 
                  className="text-sm"
                  style={{ color: formData.secondary_color }}
                >
                  Texto secundário usando a cor secundária
                </p>
              </div>

              {/* Domain Preview */}
              {formData.custom_domain && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-700">Seu domínio:</p>
                  <p className="text-sm text-gray-900">https://{formData.custom_domain}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}