'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import {
  useLawFirm,
  useUpdateLawFirm,
  useUserPreferences,
  useUpdateUserPreferences,
  useFirmFeatures,
  useUpdateFirmFeatures,
} from '@/lib/queries/useSettings'
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

interface NotificationPrefs {
  emailNotif: boolean
  deadlineAlerts: boolean
  clientMessages: boolean
  paymentNotif: boolean
  taskReminders: boolean
  notifFrequency: string
}

interface SecurityPrefs {
  twoFactorAuth: boolean
  sessionTimeout: number
  loginNotif: boolean
  dataEncryption: boolean
  auditLog: boolean
}

interface AppearancePrefs {
  theme: string
  language: string
  sidebarCollapsed: boolean
  animations: boolean
}

interface BillingFeatures {
  defaultRate: number
  invoicePrefix: string
  paymentTerms: number
  lateFee: number
  autoReminders: boolean
  paymentMethods: string
}

interface IntegrationFeatures {
  whatsappInt: boolean
  googleCalendar: boolean
  driveBackup: boolean
  apiAccess: boolean
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailNotif: true,
  deadlineAlerts: true,
  clientMessages: true,
  paymentNotif: true,
  taskReminders: false,
  notifFrequency: 'immediate',
}

const DEFAULT_SECURITY_PREFS: SecurityPrefs = {
  twoFactorAuth: false,
  sessionTimeout: 60,
  loginNotif: true,
  dataEncryption: true,
  auditLog: true,
}

const DEFAULT_APPEARANCE_PREFS: AppearancePrefs = {
  theme: 'light',
  language: 'pt-BR',
  sidebarCollapsed: false,
  animations: true,
}

const DEFAULT_BILLING_FEATURES: BillingFeatures = {
  defaultRate: 350,
  invoicePrefix: 'FAT',
  paymentTerms: 30,
  lateFee: 2,
  autoReminders: true,
  paymentMethods: 'all',
}

const DEFAULT_INTEGRATION_FEATURES: IntegrationFeatures = {
  whatsappInt: false,
  googleCalendar: true,
  driveBackup: false,
  apiAccess: false,
}

export default function SettingsPage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const toast = useToast()
  const { data: lawFirm, isLoading: firmLoading } = useLawFirm(effectiveLawFirmId ?? undefined)
  const { data: userPrefs, isLoading: prefsLoading } = useUserPreferences()
  const { data: firmFeatures, isLoading: featuresLoading } = useFirmFeatures(effectiveLawFirmId ?? undefined)
  const updateLawFirm = useUpdateLawFirm()
  const updateUserPreferences = useUpdateUserPreferences()
  const updateFirmFeatures = useUpdateFirmFeatures()

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

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS)
  const [notifDirty, setNotifDirty] = useState(false)

  // Security preferences
  const [secPrefs, setSecPrefs] = useState<SecurityPrefs>(DEFAULT_SECURITY_PREFS)
  const [secDirty, setSecDirty] = useState(false)

  // Appearance preferences
  const [appPrefs, setAppPrefs] = useState<AppearancePrefs>(DEFAULT_APPEARANCE_PREFS)
  const [appDirty, setAppDirty] = useState(false)

  // Billing features (firm-level)
  const [billingPrefs, setBillingPrefs] = useState<BillingFeatures>(DEFAULT_BILLING_FEATURES)
  const [billingDirty, setBillingDirty] = useState(false)

  // Integration features (firm-level)
  const [intPrefs, setIntPrefs] = useState<IntegrationFeatures>(DEFAULT_INTEGRATION_FEATURES)
  const [intDirty, setIntDirty] = useState(false)

  // Populate firm fields when data loads
  const populateFirmFields = useCallback(() => {
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
  }, [lawFirm])

  useEffect(() => {
    if (lawFirm && !firmDirty) {
      populateFirmFields()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lawFirm])

  // Populate user preferences from DB
  useEffect(() => {
    if (userPrefs) {
      const n = userPrefs.notifications as Partial<NotificationPrefs> | undefined
      if (n) {
        setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...n })
      }
      const s = userPrefs.security as Partial<SecurityPrefs> | undefined
      if (s) {
        setSecPrefs({ ...DEFAULT_SECURITY_PREFS, ...s })
      }
      const a = userPrefs.appearance as Partial<AppearancePrefs> | undefined
      if (a) {
        setAppPrefs({ ...DEFAULT_APPEARANCE_PREFS, ...a })
      }
    }
  }, [userPrefs])

  // Populate firm features from DB
  useEffect(() => {
    if (firmFeatures) {
      const b = firmFeatures.billing as Partial<BillingFeatures> | undefined
      if (b) {
        setBillingPrefs({ ...DEFAULT_BILLING_FEATURES, ...b })
      }
      const i = firmFeatures.integrations as Partial<IntegrationFeatures> | undefined
      if (i) {
        setIntPrefs({ ...DEFAULT_INTEGRATION_FEATURES, ...i })
      }
    }
  }, [firmFeatures])

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
    if (!effectiveLawFirmId) return
    updateLawFirm.mutate(
      { id: effectiveLawFirmId!, updates: { name: firmName, cnpj: firmCnpj, oab_number: firmOab, phone: firmPhone, email: firmEmail, website: firmWebsite } },
      {
        onSuccess: () => { toast.success('Configuracoes do escritorio salvas com sucesso!'); setFirmDirty(false) },
        onError: () => { toast.error('Erro ao salvar configuracoes do escritorio.') },
      }
    )
  }

  const handleSaveNotifications = () => {
    updateUserPreferences.mutate(
      { notifications: notifPrefs },
      {
        onSuccess: () => { toast.success('Preferencias de notificacao salvas!'); setNotifDirty(false) },
        onError: () => { toast.error('Erro ao salvar preferencias de notificacao.') },
      }
    )
  }

  const handleSaveSecurity = () => {
    updateUserPreferences.mutate(
      { security: secPrefs },
      {
        onSuccess: () => { toast.success('Configuracoes de seguranca salvas!'); setSecDirty(false) },
        onError: () => { toast.error('Erro ao salvar configuracoes de seguranca.') },
      }
    )
  }

  const handleSaveAppearance = () => {
    updateUserPreferences.mutate(
      { appearance: appPrefs },
      {
        onSuccess: () => { toast.success('Preferencias de aparencia salvas!'); setAppDirty(false) },
        onError: () => { toast.error('Erro ao salvar preferencias de aparencia.') },
      }
    )
  }

  const handleSaveBilling = () => {
    if (!effectiveLawFirmId) return
    updateFirmFeatures.mutate(
      { id: effectiveLawFirmId!, features: { billing: billingPrefs } },
      {
        onSuccess: () => { toast.success('Configuracoes de faturamento salvas!'); setBillingDirty(false) },
        onError: () => { toast.error('Erro ao salvar configuracoes de faturamento.') },
      }
    )
  }

  const handleSaveIntegrations = () => {
    if (!effectiveLawFirmId) return
    updateFirmFeatures.mutate(
      { id: effectiveLawFirmId!, features: { integrations: intPrefs } },
      {
        onSuccess: () => { toast.success('Configuracoes de integracoes salvas!'); setIntDirty(false) },
        onError: () => { toast.error('Erro ao salvar configuracoes de integracoes.') },
      }
    )
  }

  const isSaving = updateUserPreferences.isPending || updateFirmFeatures.isPending || updateLawFirm.isPending

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary'
  const checkboxCls = 'h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded'

  const SaveBar = ({ dirty, onSave, onDiscard }: { dirty: boolean; onSave: () => void; onDiscard: () => void }) => {
    if (!dirty) return null
    return (
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button onClick={onDiscard} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Descartar</button>
        <button onClick={onSave} disabled={isSaving} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50">
          {isSaving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Salvando...</> : <><CheckCircleIcon className="w-4 h-4 mr-2" />Salvar</>}
        </button>
      </div>
    )
  }

  const renderFirmTab = () => (
    <div className="space-y-6">
      {firmLoading ? (
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
          <SaveBar dirty={firmDirty} onSave={handleSaveFirm} onDiscard={populateFirmFields} />
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

  const updateNotifPref = <K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) => {
    setNotifPrefs(prev => ({ ...prev, [key]: value }))
    setNotifDirty(true)
  }

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {prefsLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          {[
            { label: 'Notificacoes por Email', desc: 'Receber notificacoes importantes por email', key: 'emailNotif' as const },
            { label: 'Alertas de Prazos', desc: 'Notificacoes de prazos processuais proximos', key: 'deadlineAlerts' as const },
            { label: 'Mensagens de Clientes', desc: 'Notificacoes de novas mensagens de clientes', key: 'clientMessages' as const },
            { label: 'Notificacoes de Pagamento', desc: 'Alertas sobre pagamentos e cobrancas', key: 'paymentNotif' as const },
            { label: 'Lembretes de Tarefas', desc: 'Notificacoes de tarefas pendentes', key: 'taskReminders' as const },
          ].map(item => (
            <div key={item.key} className="flex items-center">
              <input type="checkbox" checked={notifPrefs[item.key] as boolean} onChange={e => updateNotifPref(item.key, e.target.checked)} className={checkboxCls} />
              <label className="ml-2 text-sm text-gray-700">{item.desc}</label>
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequencia</label>
            <select value={notifPrefs.notifFrequency} onChange={e => updateNotifPref('notifFrequency', e.target.value)} className={inputCls}>
              <option value="immediate">Imediato</option>
              <option value="hourly">A cada hora</option>
              <option value="daily">Diario</option>
              <option value="weekly">Semanal</option>
            </select>
          </div>
          <SaveBar
            dirty={notifDirty}
            onSave={handleSaveNotifications}
            onDiscard={() => {
              const n = userPrefs?.notifications as Partial<NotificationPrefs> | undefined
              setNotifPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...n })
              setNotifDirty(false)
            }}
          />
        </>
      )}
    </div>
  )

  const updateSecPref = <K extends keyof SecurityPrefs>(key: K, value: SecurityPrefs[K]) => {
    setSecPrefs(prev => ({ ...prev, [key]: value }))
    setSecDirty(true)
  }

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {prefsLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          {[
            { label: 'Autenticacao de Dois Fatores', desc: 'Ativar 2FA para maior seguranca', key: 'twoFactorAuth' as const },
            { label: 'Notificacoes de Login', desc: 'Receber alertas sobre novos logins', key: 'loginNotif' as const },
            { label: 'Criptografia de Dados', desc: 'Criptografar dados sensiveis', key: 'dataEncryption' as const },
            { label: 'Log de Auditoria', desc: 'Manter registro de atividades do sistema', key: 'auditLog' as const },
          ].map(item => (
            <div key={item.key} className="flex items-center">
              <input type="checkbox" checked={secPrefs[item.key] as boolean} onChange={e => updateSecPref(item.key, e.target.checked)} className={checkboxCls} />
              <label className="ml-2 text-sm text-gray-700">{item.desc}</label>
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeout de Sessao (minutos)</label>
            <input type="number" value={secPrefs.sessionTimeout} onChange={e => updateSecPref('sessionTimeout', Number(e.target.value))} className={inputCls} />
          </div>
          <SaveBar
            dirty={secDirty}
            onSave={handleSaveSecurity}
            onDiscard={() => {
              const s = userPrefs?.security as Partial<SecurityPrefs> | undefined
              setSecPrefs({ ...DEFAULT_SECURITY_PREFS, ...s })
              setSecDirty(false)
            }}
          />
        </>
      )}
    </div>
  )

  const updateBillingPref = <K extends keyof BillingFeatures>(key: K, value: BillingFeatures[K]) => {
    setBillingPrefs(prev => ({ ...prev, [key]: value }))
    setBillingDirty(true)
  }

  const renderBillingTab = () => (
    <div className="space-y-6">
      {featuresLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Hora Padrao (R$)</label>
            <input type="number" value={billingPrefs.defaultRate} onChange={e => updateBillingPref('defaultRate', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prefixo da Fatura</label>
            <input type="text" value={billingPrefs.invoicePrefix} onChange={e => updateBillingPref('invoicePrefix', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo de Pagamento (dias)</label>
            <input type="number" value={billingPrefs.paymentTerms} onChange={e => updateBillingPref('paymentTerms', Number(e.target.value))} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Atraso (%)</label>
            <input type="number" value={billingPrefs.lateFee} onChange={e => updateBillingPref('lateFee', Number(e.target.value))} className={inputCls} />
          </div>
          <div className="flex items-center">
            <input type="checkbox" checked={billingPrefs.autoReminders} onChange={e => updateBillingPref('autoReminders', e.target.checked)} className={checkboxCls} />
            <label className="ml-2 text-sm text-gray-700">Enviar lembretes de pagamento automaticamente</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metodos de Pagamento</label>
            <select value={billingPrefs.paymentMethods} onChange={e => updateBillingPref('paymentMethods', e.target.value)} className={inputCls}>
              <option value="all">Todos (PIX, Cartao, Boleto)</option>
              <option value="pix_card">PIX e Cartao</option>
              <option value="pix_only">Apenas PIX</option>
              <option value="card_only">Apenas Cartao</option>
            </select>
          </div>
          <SaveBar
            dirty={billingDirty}
            onSave={handleSaveBilling}
            onDiscard={() => {
              const b = firmFeatures?.billing as Partial<BillingFeatures> | undefined
              setBillingPrefs({ ...DEFAULT_BILLING_FEATURES, ...b })
              setBillingDirty(false)
            }}
          />
        </>
      )}
    </div>
  )

  const updateIntPref = <K extends keyof IntegrationFeatures>(key: K, value: IntegrationFeatures[K]) => {
    setIntPrefs(prev => ({ ...prev, [key]: value }))
    setIntDirty(true)
  }

  const renderIntegrationsTab = () => (
    <div className="space-y-6">
      {featuresLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          {[
            { label: 'Integracao WhatsApp', desc: 'Conectar conta do WhatsApp Business', key: 'whatsappInt' as const },
            { label: 'Google Calendar', desc: 'Sincronizar com Google Calendar', key: 'googleCalendar' as const },
            { label: 'Backup Google Drive', desc: 'Backup automatico no Google Drive', key: 'driveBackup' as const },
            { label: 'Acesso a API', desc: 'Permitir acesso via API externa', key: 'apiAccess' as const },
          ].map(item => (
            <div key={item.key} className="flex items-center">
              <input type="checkbox" checked={intPrefs[item.key]} onChange={e => updateIntPref(item.key, e.target.checked)} className={checkboxCls} />
              <label className="ml-2 text-sm text-gray-700">{item.desc}</label>
            </div>
          ))}
          <SaveBar
            dirty={intDirty}
            onSave={handleSaveIntegrations}
            onDiscard={() => {
              const i = firmFeatures?.integrations as Partial<IntegrationFeatures> | undefined
              setIntPrefs({ ...DEFAULT_INTEGRATION_FEATURES, ...i })
              setIntDirty(false)
            }}
          />
        </>
      )}
    </div>
  )

  const updateAppPref = <K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) => {
    setAppPrefs(prev => ({ ...prev, [key]: value }))
    setAppDirty(true)
  }

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      {prefsLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
            <select value={appPrefs.theme} onChange={e => updateAppPref('theme', e.target.value)} className={inputCls}>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="auto">Automatico</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
            <select value={appPrefs.language} onChange={e => updateAppPref('language', e.target.value)} className={inputCls}>
              <option value="pt-BR">Portugues (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Espanol</option>
            </select>
          </div>
          <div className="flex items-center">
            <input type="checkbox" checked={appPrefs.sidebarCollapsed} onChange={e => updateAppPref('sidebarCollapsed', e.target.checked)} className={checkboxCls} />
            <label className="ml-2 text-sm text-gray-700">Manter menu lateral compacto por padrao</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" checked={appPrefs.animations} onChange={e => updateAppPref('animations', e.target.checked)} className={checkboxCls} />
            <label className="ml-2 text-sm text-gray-700">Habilitar animacoes na interface</label>
          </div>
          <SaveBar
            dirty={appDirty}
            onSave={handleSaveAppearance}
            onDiscard={() => {
              const a = userPrefs?.appearance as Partial<AppearancePrefs> | undefined
              setAppPrefs({ ...DEFAULT_APPEARANCE_PREFS, ...a })
              setAppDirty(false)
            }}
          />
        </>
      )}
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
