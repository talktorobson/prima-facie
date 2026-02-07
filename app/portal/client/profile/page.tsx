'use client'

import { useState, useEffect } from 'react'
import { useMyProfile, useUpdateMyProfile } from '@/lib/queries/useClientPortal'
import { useToast } from '@/components/ui/toast-provider'
import {
  UserIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

export default function ClientProfilePage() {
  const { data: profile, isLoading } = useMyProfile()
  const updateProfile = useUpdateMyProfile()
  const toast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipcode, setZipcode] = useState('')

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setEmail(profile.email ?? '')
      setPhone(profile.phone ?? '')
      setMobile(profile.mobile ?? '')
      setStreet(profile.address_street ?? '')
      setCity(profile.address_city ?? '')
      setState(profile.address_state ?? '')
      setZipcode(profile.address_zipcode ?? '')
    }
  }, [profile])

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setEmail(profile.email ?? '')
      setPhone(profile.phone ?? '')
      setMobile(profile.mobile ?? '')
      setStreet(profile.address_street ?? '')
      setCity(profile.address_city ?? '')
      setState(profile.address_state ?? '')
      setZipcode(profile.address_zipcode ?? '')
    }
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName,
        email,
        phone,
        mobile,
        address_street: street,
        address_city: city,
        address_state: state,
        address_zipcode: zipcode,
      })
      toast.success('Perfil atualizado com sucesso!')
      setIsEditing(false)
    } catch {
      toast.error('Erro ao atualizar perfil. Tente novamente.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12 bg-white shadow rounded-lg">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Perfil nao encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          Nao foi possivel carregar seus dados de perfil.
        </p>
      </div>
    )
  }

  const initials = (profile.full_name ?? profile.first_name ?? 'C')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-white">{initials}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
              <p className="text-sm text-gray-500">{profile.email ?? ''}</p>
            </div>
          </div>
          <div>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Editar
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateProfile.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Dados Pessoais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field
            label="Nome Completo"
            value={fullName}
            onChange={setFullName}
            editing={isEditing}
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            editing={isEditing}
            type="email"
          />
          <Field
            label="Telefone"
            value={phone}
            onChange={setPhone}
            editing={isEditing}
            placeholder="(11) 3456-7890"
          />
          <Field
            label="Celular"
            value={mobile}
            onChange={setMobile}
            editing={isEditing}
            placeholder="(11) 9 8765-4321"
          />
        </div>
      </div>

      {/* Address */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Endereco</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Field
              label="Logradouro"
              value={street}
              onChange={setStreet}
              editing={isEditing}
              placeholder="Rua, Avenida, etc."
            />
          </div>
          <Field
            label="Cidade"
            value={city}
            onChange={setCity}
            editing={isEditing}
          />
          <Field
            label="Estado"
            value={state}
            onChange={setState}
            editing={isEditing}
            placeholder="SP"
          />
          <Field
            label="CEP"
            value={zipcode}
            onChange={setZipcode}
            editing={isEditing}
            placeholder="00000-000"
          />
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  editing,
  type = 'text',
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  editing: boolean
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
        />
      ) : (
        <p className="mt-1 text-sm text-gray-900">{value || '-'}</p>
      )}
    </div>
  )
}
