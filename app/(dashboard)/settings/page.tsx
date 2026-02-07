'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useLawFirm, useUpdateLawFirm } from '@/lib/queries/useSettings'
import { useToast } from '@/components/ui/toast-provider'
import {
  BuildingOfficeIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  CloudIcon,
  PaintBrushIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon,
} from '@heroicons/react/24/outline'

type TabId = 'firm' | 'account' | 'notifications' | 'security' | 'billing' | 'integrations' | 'appearance'

interface TabDef {
  id: TabId
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles: string[]
}

const tabs: TabDef[] = [
  { id: 'firm', name: 'Escritorio', description: 'Informacoes basicas do escritorio', icon: BuildingOfficeIcon, allowedRoles: ['admin', 'lawyer'] },
  { id: 'account', name: 'Conta', description: 'Configuracoes da sua conta pessoal', icon: UserIcon, allowedRoles: ['admin', 'lawyer', 'staff', 'client'] },
  { id: 'notifications', name: 'Notificacoes', description: 'Configuracoes de notificacoes e alertas', icon: BellIcon, allowedRoles: ['admin', 'lawyer', 'staff', 'client'] },
  { id: 'security', name: 'Seguranca', description: 'Configuracoes de seguranca e privacidade', icon: ShieldCheckIcon, allowedRoles: ['admin', 'lawyer', 'staff'] },
  { id: 'billing', name: 'Faturamento', description: 'Configuracoes de cobranca e pagamentos', icon: CurrencyDollarIcon, allowedRoles: ['admin', 'lawyer'] },
  { id: 'integrations', name: 'Integracoes', description: 'Configuracoes de integracoes e APIs', icon: CloudIcon, allowedRoles: ['admin'] },
  { id: 'appearance', name: 'Aparencia', description: 'Personalizacoes de interface e tema', icon: PaintBrushIcon, allowedRoles: ['admin', 'lawyer', 'staff', 'client'] },
]

export default function SettingsPage() {
  const { profile } = useAuthContext()
  const toast = useToast()
  const { data: lawFirm, isLoading } = useLawFirm(profile?.law_firm_id ?? undefined)
  const updateLawFirm = useUpdateLawFirm()

  const [activeTab, setActiveTab] = useState<TabId>('firm')
  const [showPassword, setShowPassword] = useState(false)

  // Firm form state
  const [firmName, setFirmName] = useState('')
  const [firmCnpj, setFirmCnpj] = useState('')
  const [firmOab, setFirmOab] = useState('')
  const [firmPhone, setFirmPhone] = useState('')
  const [firmEmail, setFirmEmail] = useState('')
  const [firmWebsite, setFirmWebsite] = useState('')
  const [firmAddress, setFirmAddress] = useState('')
  const [firmDirty, setFirmDirty] = useState(false)

  // Notification preferences (local state)
  const [emailNotif, setEmailNotif] = useState(true)
  const [deadlineAlerts, setDeadlineAlerts] = useState(true)
  const [clientMessages, setClientMessages] = useState(true)
  const [paymentNotif, setPaymentNotif] = useState(true)
  const [taskReminders, setTaskReminders] = useState(false)
  const [notifFrequency, setNotifFrequency] = useState('immediate')

  // Security preferences (local state)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(60)
  const [loginNotif, setLoginNotif] = useState(true)
  const [dataEncryption, setDataEncryption] = useState(true)
  const [auditLog, setAuditLog] = useState(true)

  // Billing preferences (local state)
  const [defaultRate, setDefaultRate] = useState(350)
  const [invoicePrefix, setInvoicePrefix] = useState('FAT')
  const [paymentTerms, setPaymentTerms] = useState(30)
  const [lateFee, setLateFee] = useState(2)
  const [autoReminders, setAutoReminders] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState('all')

  // Integrations (local state)
  const [whatsappInt, setWhatsappInt] = useState(false)
  const [googleCalendar, setGoogleCalendar] = useState(true)
  const [driveBackup, setDriveBackup] = useState(false)
  const [apiAccess, setApiAccess] = useState(false)

  // Appearance (local state)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('pt-BR')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [animations, setAnimations] = useState(true)

  // Populate firm fields when data loads
  const populateFirmFields = () => {
    if (lawFirm) {
      setFirmName(lawFirm.name || '')
      setFirmCnpj(lawFirm.cnpj || '')
      setFirmOab(lawFirm.oab_number || '')
      setFirmPhone(lawFirm.phone || '')
      setFirmEmail(lawFirm.email || '')
      setFirmWebsite(lawFirm.website || '')
      const addr = [lawFirm.address_street, lawFirm.address_number, lawFirm.address_neighborhood, lawFirm.address_city, lawFirm.address_state, lawFirm.address_zipcode]
        .filter(Boolean).join(', ')
      setFirmAddress(addr)
      setFirmDirty(false)
    }
  }

  // Populate firm fields when lawFirm data loads
  useEffect(() => {
    if (lawFirm && !firmDirty) {
      populateFirmFields()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lawFirm])

  const userRole = profile?.user_type || 'staff'
  const visibleTabs = tabs.filter(t => t.allowedRoles.includes(userRole))

  if (profile?.user_type === 'super_admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
          <p className="mt-2 text-gray-600">Configuracoes da plataforma</p>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">
            As configuracoes de plataforma estao disponiveis em{' '}
            <a href="/platform" className="text-primary hover:underline font-medium">Plataforma</a>.
          </p>
        </div>
      </div>
    )
  }

  const handleSaveFirm = () => {
    if (!profile?.law_firm_id) return
    updateLawFirm.mutate(
      { id: profile.law_firm_id, updates: { name: firmName, cnpj: firmCnpj, oab_number: firmOab, phone: firmPhone, email: firmEmail, website: firmWebsite } },
      {
        onSuccess: () => { toast.success('Configuracoes do escritorio salvas com sucesso!'); setFirmDirty(false) },
        onError: () => { toast.error('Erro ao salvar configuracoes do escritorio.') },
      }
    )
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary'
  const checkboxCls = 'h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded'

  const renderFirmTab = () => (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Escritorio <span className="text-red-500">*</span></label>
            <input type="text" value={firmName} onChange={e => { setFirmName(e.target.value); setFirmDirty(true) }} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input type="text" value={firmCnpj} onChange={e => { setFirmCnpj(e.target.value); setFirmDirty(true) }} className={inputCls} placeholder="12.345.678/0001-90" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registro OAB</label>
            <input type="text" value={firmOab} onChange={e => { setFirmOab(e.target.value); setFirmDirty(true) }} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input type="tel" value={firmPhone} onChange={e => { setFirmPhone(e.target.value); setFirmDirty(true) }} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" value={firmEmail} onChange={e => { setFirmEmail(e.target.value); setFirmDirty(true) }} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <input type="text" value={firmWebsite} onChange={e => { setFirmWebsite(e.target.value); setFirmDirty(true) }} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereco</label>
            <textarea value={firmAddress} onChange={e => { setFirmAddress(e.target.value); setFirmDirty(true) }} rows={2} className={inputCls} />
            <p className="mt-1 text-sm text-gray-500">Endereco completo do escritorio</p>
          </div>
          {firmDirty && (
            <div className="flex justify-end space-x-3">
              <button onClick={populateFirmFields} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Descartar</button>
              <button onClick={handleSaveFirm} disabled={updateLawFirm.isPending} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50">
                {updateLawFirm.isPending ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Salvando...</> : <><CheckCircleIcon className="w-4 h-4 mr-2" />Salvar</>}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderAccountTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input type="text" value={profile?.first_name || ''} readOnly className={`${inputCls} bg-gray-50`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome</label>
        <input type="text" value={profile?.last_name || ''} readOnly className={`${inputCls} bg-gray-50`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={profile?.email || ''} readOnly className={`${inputCls} bg-gray-50`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
        <input type="tel" value={profile?.phone || ''} readOnly className={`${inputCls} bg-gray-50`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">OAB</label>
        <input type="text" value={profile?.oab_number || ''} readOnly className={`${inputCls} bg-gray-50`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Funcao</label>
        <input type="text" value={profile?.user_type === 'admin' ? 'Administrador' : profile?.user_type === 'lawyer' ? 'Advogado' : profile?.user_type === 'staff' ? 'Funcionario' : 'Cliente'} readOnly className={`${inputCls} bg-gray-50`} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <div className="relative">
          <input type={showPassword ? 'text' : 'password'} placeholder="Nova senha (deixe em branco para manter atual)" className={inputCls} />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {showPassword ? <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : <EyeIcon className="h-5 w-5 text-gray-400" />}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500">Para alterar dados da conta, entre em contato com o administrador.</p>
    </div>
  )

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {[
        { label: 'Notificacoes por Email', desc: 'Receber notificacoes importantes por email', value: emailNotif, set: setEmailNotif },
        { label: 'Alertas de Prazos', desc: 'Notificacoes de prazos processuais proximos', value: deadlineAlerts, set: setDeadlineAlerts },
        { label: 'Mensagens de Clientes', desc: 'Notificacoes de novas mensagens de clientes', value: clientMessages, set: setClientMessages },
        { label: 'Notificacoes de Pagamento', desc: 'Alertas sobre pagamentos e cobrancas', value: paymentNotif, set: setPaymentNotif },
        { label: 'Lembretes de Tarefas', desc: 'Notificacoes de tarefas pendentes', value: taskReminders, set: setTaskReminders },
      ].map(item => (
        <div key={item.label} className="flex items-center">
          <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} className={checkboxCls} />
          <label className="ml-2 text-sm text-gray-700">{item.desc}</label>
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Frequencia</label>
        <select value={notifFrequency} onChange={e => setNotifFrequency(e.target.value)} className={inputCls}>
          <option value="immediate">Imediato</option>
          <option value="hourly">A cada hora</option>
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
        </select>
      </div>
    </div>
  )

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {[
        { label: 'Autenticacao de Dois Fatores', desc: 'Ativar 2FA para maior seguranca', value: twoFactorAuth, set: setTwoFactorAuth },
        { label: 'Notificacoes de Login', desc: 'Receber alertas sobre novos logins', value: loginNotif, set: setLoginNotif },
        { label: 'Criptografia de Dados', desc: 'Criptografar dados sensiveis', value: dataEncryption, set: setDataEncryption },
        { label: 'Log de Auditoria', desc: 'Manter registro de atividades do sistema', value: auditLog, set: setAuditLog },
      ].map(item => (
        <div key={item.label} className="flex items-center">
          <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} className={checkboxCls} />
          <label className="ml-2 text-sm text-gray-700">{item.desc}</label>
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timeout de Sessao (minutos)</label>
        <input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} className={inputCls} />
      </div>
    </div>
  )

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Valor Hora Padrao (R$)</label>
        <input type="number" value={defaultRate} onChange={e => setDefaultRate(Number(e.target.value))} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prefixo da Fatura</label>
        <input type="text" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Pagamento (dias)</label>
        <input type="number" value={paymentTerms} onChange={e => setPaymentTerms(Number(e.target.value))} className={inputCls} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Atraso (%)</label>
        <input type="number" value={lateFee} onChange={e => setLateFee(Number(e.target.value))} className={inputCls} />
      </div>
      <div className="flex items-center">
        <input type="checkbox" checked={autoReminders} onChange={e => setAutoReminders(e.target.checked)} className={checkboxCls} />
        <label className="ml-2 text-sm text-gray-700">Enviar lembretes de pagamento automaticamente</label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Metodos de Pagamento</label>
        <select value={paymentMethods} onChange={e => setPaymentMethods(e.target.value)} className={inputCls}>
          <option value="all">Todos (PIX, Cartao, Boleto)</option>
          <option value="pix_card">PIX e Cartao</option>
          <option value="pix_only">Apenas PIX</option>
          <option value="card_only">Apenas Cartao</option>
        </select>
      </div>
    </div>
  )

  const renderIntegrationsTab = () => (
    <div className="space-y-6">
      {[
        { label: 'Integracao WhatsApp', desc: 'Conectar conta do WhatsApp Business', value: whatsappInt, set: setWhatsappInt },
        { label: 'Google Calendar', desc: 'Sincronizar com Google Calendar', value: googleCalendar, set: setGoogleCalendar },
        { label: 'Backup Google Drive', desc: 'Backup automatico no Google Drive', value: driveBackup, set: setDriveBackup },
        { label: 'Acesso a API', desc: 'Permitir acesso via API externa', value: apiAccess, set: setApiAccess },
      ].map(item => (
        <div key={item.label} className="flex items-center">
          <input type="checkbox" checked={item.value} onChange={e => item.set(e.target.checked)} className={checkboxCls} />
          <label className="ml-2 text-sm text-gray-700">{item.desc}</label>
        </div>
      ))}
    </div>
  )

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
        <select value={theme} onChange={e => setTheme(e.target.value)} className={inputCls}>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
          <option value="auto">Automatico</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
        <select value={language} onChange={e => setLanguage(e.target.value)} className={inputCls}>
          <option value="pt-BR">Portugues (Brasil)</option>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Espanol</option>
        </select>
      </div>
      <div className="flex items-center">
        <input type="checkbox" checked={sidebarCollapsed} onChange={e => setSidebarCollapsed(e.target.checked)} className={checkboxCls} />
        <label className="ml-2 text-sm text-gray-700">Manter menu lateral compacto por padrao</label>
      </div>
      <div className="flex items-center">
        <input type="checkbox" checked={animations} onChange={e => setAnimations(e.target.checked)} className={checkboxCls} />
        <label className="ml-2 text-sm text-gray-700">Habilitar animacoes na interface</label>
      </div>
    </div>
  )

  const tabRenderers: Record<TabId, () => React.ReactNode> = {
    firm: renderFirmTab,
    account: renderAccountTab,
    notifications: renderNotificationsTab,
    security: renderSecurityTab,
    billing: renderBillingTab,
    integrations: renderIntegrationsTab,
    appearance: renderAppearanceTab,
  }

  const activeTabDef = visibleTabs.find(t => t.id === activeTab) || visibleTabs[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <p className="mt-2 text-gray-600">Gerencie as configuracoes do escritorio e da sua conta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {visibleTabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                <div className="flex items-center">
                  <tab.icon className="w-5 h-5 mr-3" />
                  <div>
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                {activeTabDef && <activeTabDef.icon className="h-6 w-6 text-primary mr-3" />}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{activeTabDef?.name}</h3>
                  <p className="text-sm text-gray-600">{activeTabDef?.description}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {tabRenderers[activeTab]?.()}
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h4 className="font-medium text-blue-900">Seguranca</h4>
              <p className="text-sm text-blue-700">Suas configuracoes sao criptografadas e seguras</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CloudIcon className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <h4 className="font-medium text-green-900">Backup Automatico</h4>
              <p className="text-sm text-green-700">Backup das configuracoes realizado diariamente</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <CogIcon className="h-6 w-6 text-purple-600 mr-3" />
            <div>
              <h4 className="font-medium text-purple-900">Sincronizacao</h4>
              <p className="text-sm text-purple-700">Configuracoes sincronizadas em tempo real</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
