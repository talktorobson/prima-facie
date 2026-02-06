'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { 
  BuildingOfficeIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  DocumentIcon,
  CloudIcon,
  KeyIcon,
  PaintBrushIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  IdentificationIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface SettingsSection {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  settings: Setting[]
  allowedRoles?: string[]
}

interface Setting {
  id: string
  name: string
  description: string
  type: 'text' | 'email' | 'tel' | 'password' | 'select' | 'checkbox' | 'textarea' | 'number'
  value: any
  options?: { value: string; label: string }[]
  required?: boolean
  validation?: string
}

export default function SettingsPage() {
  const { profile } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('firm')
  const [settingsSections, setSettingsSections] = useState<SettingsSection[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchSettings()
  }, [profile])

  const fetchSettings = async () => {
    if (!profile?.law_firm_id) return

    try {
      setLoading(true)
      
      // Role-based settings sections
      const allSettings: SettingsSection[] = [
        {
          id: 'firm',
          name: 'Escritório',
          description: 'Informações básicas do escritório',
          icon: BuildingOfficeIcon,
          allowedRoles: ['admin', 'lawyer'],
          settings: [
            {
              id: 'firm_name',
              name: 'Nome do Escritório',
              description: 'Nome oficial do escritório de advocacia',
              type: 'text',
              value: 'Dávila Reis Advocacia',
              required: true
            },
            {
              id: 'firm_cnpj',
              name: 'CNPJ',
              description: 'Cadastro Nacional da Pessoa Jurídica',
              type: 'text',
              value: '12.345.678/0001-90',
              required: true,
              validation: 'cnpj'
            },
            {
              id: 'firm_oab',
              name: 'Registro OAB',
              description: 'Número de registro na Ordem dos Advogados do Brasil',
              type: 'text',
              value: 'SP 123.456',
              required: true
            },
            {
              id: 'firm_address',
              name: 'Endereço',
              description: 'Endereço completo do escritório',
              type: 'textarea',
              value: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100'
            },
            {
              id: 'firm_phone',
              name: 'Telefone',
              description: 'Telefone principal do escritório',
              type: 'tel',
              value: '(11) 3555-1234'
            },
            {
              id: 'firm_email',
              name: 'Email',
              description: 'Email oficial do escritório',
              type: 'email',
              value: 'contato@davilareis.adv.br',
              required: true
            },
            {
              id: 'firm_website',
              name: 'Website',
              description: 'Site oficial do escritório',
              type: 'text',
              value: 'https://www.davilareis.adv.br'
            }
          ]
        },
        {
          id: 'account',
          name: 'Conta',
          description: 'Configurações da sua conta pessoal',
          icon: UserIcon,
          allowedRoles: ['admin', 'lawyer', 'staff', 'client'],
          settings: [
            {
              id: 'user_first_name',
              name: 'Nome',
              description: 'Seu primeiro nome',
              type: 'text',
              value: 'Robson',
              required: true
            },
            {
              id: 'user_last_name',
              name: 'Sobrenome',
              description: 'Seu sobrenome',
              type: 'text',
              value: 'Benevenuto D\'Avila Reis',
              required: true
            },
            {
              id: 'user_email',
              name: 'Email',
              description: 'Email da sua conta',
              type: 'email',
              value: 'robson@davilareis.adv.br',
              required: true
            },
            {
              id: 'user_phone',
              name: 'Telefone',
              description: 'Seu telefone pessoal',
              type: 'tel',
              value: '(11) 9 9999-8888'
            },
            {
              id: 'user_oab',
              name: 'OAB',
              description: 'Seu número de registro na OAB',
              type: 'text',
              value: 'SP 987.654'
            },
            {
              id: 'user_role',
              name: 'Função',
              description: 'Sua função no escritório',
              type: 'select',
              value: 'admin',
              options: [
                { value: 'admin', label: 'Administrador' },
                { value: 'lawyer', label: 'Advogado' },
                { value: 'staff', label: 'Funcionário' }
              ]
            },
            {
              id: 'user_password',
              name: 'Senha',
              description: 'Alterar senha da conta',
              type: 'password',
              value: ''
            }
          ]
        },
        {
          id: 'notifications',
          name: 'Notificações',
          description: 'Configurações de notificações e alertas',
          icon: BellIcon,
          allowedRoles: ['admin', 'lawyer', 'staff', 'client'],
          settings: [
            {
              id: 'email_notifications',
              name: 'Notificações por Email',
              description: 'Receber notificações importantes por email',
              type: 'checkbox',
              value: true
            },
            {
              id: 'case_deadline_alerts',
              name: 'Alertas de Prazos',
              description: 'Notificações de prazos processuais próximos',
              type: 'checkbox',
              value: true
            },
            {
              id: 'client_messages',
              name: 'Mensagens de Clientes',
              description: 'Notificações de novas mensagens de clientes',
              type: 'checkbox',
              value: true
            },
            {
              id: 'payment_notifications',
              name: 'Notificações de Pagamento',
              description: 'Alertas sobre pagamentos e cobranças',
              type: 'checkbox',
              value: true
            },
            {
              id: 'task_reminders',
              name: 'Lembretes de Tarefas',
              description: 'Notificações de tarefas pendentes',
              type: 'checkbox',
              value: false
            },
            {
              id: 'notification_frequency',
              name: 'Frequência',
              description: 'Com que frequência receber notificações',
              type: 'select',
              value: 'immediate',
              options: [
                { value: 'immediate', label: 'Imediato' },
                { value: 'hourly', label: 'A cada hora' },
                { value: 'daily', label: 'Diário' },
                { value: 'weekly', label: 'Semanal' }
              ]
            }
          ]
        },
        {
          id: 'security',
          name: 'Segurança',
          description: 'Configurações de segurança e privacidade',
          icon: ShieldCheckIcon,
          allowedRoles: ['admin', 'lawyer', 'staff'],
          settings: [
            {
              id: 'two_factor_auth',
              name: 'Autenticação de Dois Fatores',
              description: 'Ativar 2FA para maior segurança',
              type: 'checkbox',
              value: false
            },
            {
              id: 'session_timeout',
              name: 'Timeout de Sessão',
              description: 'Tempo limite para logout automático (minutos)',
              type: 'number',
              value: 60
            },
            {
              id: 'login_notifications',
              name: 'Notificações de Login',
              description: 'Receber alertas sobre novos logins',
              type: 'checkbox',
              value: true
            },
            {
              id: 'data_encryption',
              name: 'Criptografia de Dados',
              description: 'Criptografar dados sensíveis',
              type: 'checkbox',
              value: true
            },
            {
              id: 'audit_log',
              name: 'Log de Auditoria',
              description: 'Manter registro de atividades do sistema',
              type: 'checkbox',
              value: true
            }
          ]
        },
        {
          id: 'billing',
          name: 'Faturamento',
          description: 'Configurações de cobrança e pagamentos',
          icon: CurrencyDollarIcon,
          allowedRoles: ['admin', 'lawyer'],
          settings: [
            {
              id: 'default_hourly_rate',
              name: 'Valor Hora Padrão',
              description: 'Valor por hora para novos casos (R$)',
              type: 'number',
              value: 350
            },
            {
              id: 'invoice_prefix',
              name: 'Prefixo da Fatura',
              description: 'Prefixo para numeração de faturas',
              type: 'text',
              value: 'FAT'
            },
            {
              id: 'payment_terms',
              name: 'Prazo de Pagamento',
              description: 'Prazo padrão para pagamento (dias)',
              type: 'number',
              value: 30
            },
            {
              id: 'late_fee',
              name: 'Taxa de Atraso',
              description: 'Taxa de juros por atraso (%)',
              type: 'number',
              value: 2
            },
            {
              id: 'auto_reminders',
              name: 'Lembretes Automáticos',
              description: 'Enviar lembretes de pagamento automaticamente',
              type: 'checkbox',
              value: true
            },
            {
              id: 'payment_methods',
              name: 'Métodos de Pagamento',
              description: 'Métodos aceitos para pagamento',
              type: 'select',
              value: 'all',
              options: [
                { value: 'all', label: 'Todos (PIX, Cartão, Boleto)' },
                { value: 'pix_card', label: 'PIX e Cartão' },
                { value: 'pix_only', label: 'Apenas PIX' },
                { value: 'card_only', label: 'Apenas Cartão' }
              ]
            }
          ]
        },
        {
          id: 'integrations',
          name: 'Integrações',
          description: 'Configurações de integrações e APIs',
          icon: CloudIcon,
          allowedRoles: ['admin'],
          settings: [
            {
              id: 'whatsapp_integration',
              name: 'Integração WhatsApp',
              description: 'Conectar conta do WhatsApp Business',
              type: 'checkbox',
              value: false
            },
            {
              id: 'google_calendar',
              name: 'Google Calendar',
              description: 'Sincronizar com Google Calendar',
              type: 'checkbox',
              value: true
            },
            {
              id: 'drive_backup',
              name: 'Backup Google Drive',
              description: 'Backup automático no Google Drive',
              type: 'checkbox',
              value: false
            },
            {
              id: 'email_integration',
              name: 'Integração de Email',
              description: 'Conectar conta de email para envios automáticos',
              type: 'email',
              value: 'smtp@davilareis.adv.br'
            },
            {
              id: 'api_access',
              name: 'Acesso à API',
              description: 'Permitir acesso via API externa',
              type: 'checkbox',
              value: false
            }
          ]
        },
        {
          id: 'appearance',
          name: 'Aparência',
          description: 'Personalizações de interface e tema',
          icon: PaintBrushIcon,
          allowedRoles: ['admin', 'lawyer', 'staff', 'client'],
          settings: [
            {
              id: 'theme',
              name: 'Tema',
              description: 'Escolha o tema da interface',
              type: 'select',
              value: 'light',
              options: [
                { value: 'light', label: 'Claro' },
                { value: 'dark', label: 'Escuro' },
                { value: 'auto', label: 'Automático' }
              ]
            },
            {
              id: 'language',
              name: 'Idioma',
              description: 'Idioma da interface',
              type: 'select',
              value: 'pt-BR',
              options: [
                { value: 'pt-BR', label: 'Português (Brasil)' },
                { value: 'en-US', label: 'English (US)' },
                { value: 'es-ES', label: 'Español' }
              ]
            },
            {
              id: 'sidebar_collapsed',
              name: 'Menu Lateral Compacto',
              description: 'Manter menu lateral compacto por padrão',
              type: 'checkbox',
              value: false
            },
            {
              id: 'animations',
              name: 'Animações',
              description: 'Habilitar animações na interface',
              type: 'checkbox',
              value: true
            }
          ]
        }
      ]

      // Filter settings based on user role
      const userRole = profile.user_type
      const filteredSettings = allSettings.filter(section => {
        if (!section.allowedRoles) return true
        return section.allowedRoles.includes(userRole)
      })

      setSettingsSections(filteredSettings)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSettingChange = (sectionId: string, settingId: string, value: any) => {
    setSettingsSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? {
              ...section,
              settings: section.settings.map(setting =>
                setting.id === settingId 
                  ? { ...setting, value }
                  : setting
              )
            }
          : section
      )
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Simulate save operation
    setTimeout(() => {
      setIsSaving(false)
      setHasChanges(false)
      alert('Configurações salvas com sucesso!')
    }, 1500)
  }

  const handleReset = () => {
    if (confirm('Tem certeza que deseja descartar as alterações?')) {
      fetchSettings()
      setHasChanges(false)
    }
  }

  const togglePasswordVisibility = (settingId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [settingId]: !prev[settingId]
    }))
  }

  const renderSettingInput = (sectionId: string, setting: Setting) => {
    const commonClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
    
    switch (setting.type) {
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={setting.id}
              checked={setting.value}
              onChange={(e) => handleSettingChange(sectionId, setting.id, e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor={setting.id} className="ml-2 text-sm text-gray-700">
              {setting.description}
            </label>
          </div>
        )
      
      case 'select':
        return (
          <select
            id={setting.id}
            value={setting.value}
            onChange={(e) => handleSettingChange(sectionId, setting.id, e.target.value)}
            className={commonClasses}
          >
            {setting.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case 'textarea':
        return (
          <textarea
            id={setting.id}
            value={setting.value}
            onChange={(e) => handleSettingChange(sectionId, setting.id, e.target.value)}
            rows={3}
            className={commonClasses}
            placeholder={setting.description}
          />
        )
      
      case 'password':
        return (
          <div className="relative">
            <input
              type={showPassword[setting.id] ? 'text' : 'password'}
              id={setting.id}
              value={setting.value}
              onChange={(e) => handleSettingChange(sectionId, setting.id, e.target.value)}
              className={commonClasses}
              placeholder="Nova senha (deixe em branco para manter atual)"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(setting.id)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword[setting.id] ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        )
      
      default:
        return (
          <input
            type={setting.type}
            id={setting.id}
            value={setting.value}
            onChange={(e) => handleSettingChange(sectionId, setting.id, e.target.value)}
            className={commonClasses}
            placeholder={setting.description}
            required={setting.required}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const activeSettingsSection = settingsSections.find(section => section.id === activeSection)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="mt-2 text-gray-600">
            Gerencie as configurações do escritório e da sua conta
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Descartar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingsSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <section.icon className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs opacity-75">{section.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSettingsSection && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <activeSettingsSection.icon className="h-6 w-6 text-primary mr-3" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{activeSettingsSection.name}</h3>
                    <p className="text-sm text-gray-600">{activeSettingsSection.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {activeSettingsSection.settings.map((setting) => (
                    <div key={setting.id}>
                      {setting.type !== 'checkbox' && (
                        <label htmlFor={setting.id} className="block text-sm font-medium text-gray-700 mb-1">
                          {setting.name}
                          {setting.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      )}
                      
                      {renderSettingInput(activeSettingsSection.id, setting)}
                      
                      {setting.type !== 'checkbox' && setting.description && (
                        <p className="mt-1 text-sm text-gray-500">{setting.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900">Segurança</h4>
              <p className="text-sm text-blue-700">Suas configurações são criptografadas e seguras</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CloudIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h4 className="font-medium text-green-900">Backup Automático</h4>
              <p className="text-sm text-green-700">Backup das configurações realizado diariamente</p>
            </div>
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CogIcon className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <h4 className="font-medium text-purple-900">Sincronização</h4>
              <p className="text-sm text-purple-700">Configurações sincronizadas em tempo real</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}