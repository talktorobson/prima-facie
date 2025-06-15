'use client'

import { useState } from 'react'
import { 
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhoneIcon,
  CogIcon
} from '@heroicons/react/24/outline'

// Mock client data
const mockClientProfile = {
  id: '1',
  client_number: 'CLI-2024-001',
  name: 'João Silva Santos',
  email: 'joao.silva@email.com',
  cpf: '123.456.789-00',
  rg: '12.345.678-9',
  phone: '(11) 3456-7890',
  mobile: '(11) 9 8765-4321',
  whatsapp: '(11) 9 8765-4321',
  birth_date: '1985-06-15',
  marital_status: 'casado',
  profession: 'Engenheiro',
  nationality: 'Brasileira',
  address: {
    street: 'Rua das Flores',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipcode: '01234-567'
  },
  emergency_contact: {
    name: 'Maria Silva Santos',
    phone: '(11) 9 1234-5678',
    relationship: 'Esposa'
  },
  portal_preferences: {
    email_notifications: true,
    sms_notifications: false,
    whatsapp_notifications: true,
    portal_notifications: true
  },
  client_since: '2024-01-15',
  relationship_manager: 'Dra. Maria Silva Santos'
}

const maritalStatusOptions = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' }
]

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function ClientProfilePage() {
  const [profile, setProfile] = useState(mockClientProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState(mockClientProfile)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')

  const handleEdit = () => {
    setEditedProfile(profile)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedProfile(profile)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProfile(editedProfile)
      setIsEditing(false)
      console.log('Profile updated:', editedProfile)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setEditedProfile(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setEditedProfile(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setEditedProfile(prev => ({
      ...prev,
      portal_preferences: {
        ...prev.portal_preferences,
        [field]: checked
      }
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4')
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const currentData = isEditing ? editedProfile : profile

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="mt-1 text-gray-600">
                Cliente desde {formatDate(profile.client_since)} • {profile.client_number}
              </p>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PencilIcon className="-ml-1 mr-2 h-4 w-4" />
                  Editar
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <XMarkIcon className="-ml-1 mr-2 h-4 w-4" />
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="-ml-1 mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('personal')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'personal'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="h-4 w-4 inline mr-2" />
              Dados Pessoais
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contact'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PhoneIcon className="h-4 w-4 inline mr-2" />
              Contato & Endereço
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preferences'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CogIcon className="h-4 w-4 inline mr-2" />
              Preferências
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{currentData.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={currentData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{currentData.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">CPF</label>
                  <p className="mt-1 text-sm text-gray-500">{currentData.cpf} (não editável)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">RG</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentData.rg}
                      onChange={(e) => handleInputChange('rg', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{currentData.rg}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={currentData.birth_date}
                      onChange={(e) => handleInputChange('birth_date', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{formatDate(currentData.birth_date)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado Civil</label>
                  {isEditing ? (
                    <select
                      value={currentData.marital_status}
                      onChange={(e) => handleInputChange('marital_status', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    >
                      {maritalStatusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {maritalStatusOptions.find(o => o.value === currentData.marital_status)?.label}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Profissão</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentData.profession}
                      onChange={(e) => handleInputChange('profession', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{currentData.profession}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nacionalidade</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{currentData.nationality}</p>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contato de Emergência</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.emergency_contact.name}
                        onChange={(e) => handleInputChange('emergency_contact.name', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.emergency_contact.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.emergency_contact.phone}
                        onChange={(e) => handleInputChange('emergency_contact.phone', formatPhone(e.target.value))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="(11) 9 1234-5678"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.emergency_contact.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Relacionamento</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.emergency_contact.relationship}
                        onChange={(e) => handleInputChange('emergency_contact.relationship', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="Cônjuge, Filho, etc."
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.emergency_contact.relationship}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact & Address Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Telefone</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentData.phone}
                      onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="(11) 3456-7890"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{currentData.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Celular</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentData.mobile}
                      onChange={(e) => handleInputChange('mobile', formatPhone(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="(11) 9 8765-4321"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{currentData.mobile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">WhatsApp</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={currentData.whatsapp}
                      onChange={(e) => handleInputChange('whatsapp', formatPhone(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="(11) 9 8765-4321"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{currentData.whatsapp}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Logradouro</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.address.street}
                        onChange={(e) => handleInputChange('address.street', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="Rua, Avenida, etc."
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.address.street}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.address.number}
                        onChange={(e) => handleInputChange('address.number', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.address.number}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Complemento</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.address.complement}
                        onChange={(e) => handleInputChange('address.complement', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="Apto, Sala, etc."
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.address.complement}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bairro</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.address.neighborhood}
                        onChange={(e) => handleInputChange('address.neighborhood', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.address.neighborhood}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cidade</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.address.city}
                        onChange={(e) => handleInputChange('address.city', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.address.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    {isEditing ? (
                      <select
                        value={currentData.address.state}
                        onChange={(e) => handleInputChange('address.state', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      >
                        {brazilianStates.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.address.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">CEP</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={currentData.address.zipcode}
                        onChange={(e) => handleInputChange('address.zipcode', formatCEP(e.target.value))}
                        maxLength={9}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        placeholder="00000-000"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentData.address.zipcode}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preferências de Notificação</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="email_notifications"
                      type="checkbox"
                      checked={currentData.portal_preferences.email_notifications}
                      onChange={(e) => handleCheckboxChange('email_notifications', e.target.checked)}
                      disabled={!isEditing}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-900">
                      Receber notificações por e-mail
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="sms_notifications"
                      type="checkbox"
                      checked={currentData.portal_preferences.sms_notifications}
                      onChange={(e) => handleCheckboxChange('sms_notifications', e.target.checked)}
                      disabled={!isEditing}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="sms_notifications" className="ml-2 block text-sm text-gray-900">
                      Receber notificações por SMS
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="whatsapp_notifications"
                      type="checkbox"
                      checked={currentData.portal_preferences.whatsapp_notifications}
                      onChange={(e) => handleCheckboxChange('whatsapp_notifications', e.target.checked)}
                      disabled={!isEditing}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="whatsapp_notifications" className="ml-2 block text-sm text-gray-900">
                      Receber notificações por WhatsApp
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="portal_notifications"
                      type="checkbox"
                      checked={currentData.portal_preferences.portal_notifications}
                      onChange={(e) => handleCheckboxChange('portal_notifications', e.target.checked)}
                      disabled={!isEditing}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="portal_notifications" className="ml-2 block text-sm text-gray-900">
                      Receber notificações no portal
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Escritório</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Responsável pela conta:</strong> {profile.relationship_manager}</p>
                    <p className="text-sm"><strong>Cliente desde:</strong> {formatDate(profile.client_since)}</p>
                    <p className="text-sm"><strong>Número do cliente:</strong> {profile.client_number}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}