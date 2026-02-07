'use client'

import { useState, type FormEvent } from 'react'
import type { WebsiteContactFormField } from '@/types/website'

interface WebsiteContactFormProps {
  lawFirmId: string
  customFields?: WebsiteContactFormField[]
}

export default function WebsiteContactForm({ lawFirmId, customFields = [] }: WebsiteContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleCustomChange = (fieldId: string, value: string) => {
    setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/contact/website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          law_firm_id: lawFirmId,
          name,
          email,
          phone,
          company_name: companyName || undefined,
          cnpj: cnpj || undefined,
          custom_fields: Object.keys(customValues).length > 0 ? customValues : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar formulario. Tente novamente.')
        return
      }

      setSuccess(true)
      setName('')
      setEmail('')
      setPhone('')
      setCompanyName('')
      setCnpj('')
      setCustomValues({})
    } catch {
      setError('Erro de conexao. Verifique sua internet e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-website-mist p-8 rounded text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-serif font-semibold text-website-ink mb-2">Mensagem Enviada!</h3>
        <p className="text-website-stone mb-4">
          Recebemos sua mensagem e entraremos em contato em breve.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="text-sm text-website-accent hover:underline"
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  const inputClasses = 'w-full px-4 py-3 border border-website-mist rounded focus:outline-none focus:border-website-accent'

  return (
    <div className="bg-white border border-website-mist p-8 rounded">
      <h2 className="text-xl font-serif font-semibold text-website-ink mb-6">
        Como podemos ajudar?
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fixed fields */}
        <div>
          <label className="block text-sm font-medium text-website-ink mb-1">
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            className={inputClasses}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-website-ink mb-1">
            E-mail <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className={inputClasses}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-website-ink mb-1">
            Telefone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(00) 00000-0000"
            className={inputClasses}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-website-ink mb-1">Empresa</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Nome da empresa (opcional)"
            className={inputClasses}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-website-ink mb-1">CNPJ</label>
          <input
            type="text"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="00.000.000/0000-00 (opcional)"
            className={inputClasses}
          />
        </div>

        {/* Custom fields */}
        {customFields.map((field) => (
          <div key={field.id}>
            <label className="block text-sm font-medium text-website-ink mb-1">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            {field.type === 'select' ? (
              <select
                required={field.required}
                value={customValues[field.id] || ''}
                onChange={(e) => handleCustomChange(field.id, e.target.value)}
                className={inputClasses}
              >
                <option value="">{field.placeholder || 'Selecione...'}</option>
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                required={field.required}
                rows={4}
                value={customValues[field.id] || ''}
                onChange={(e) => handleCustomChange(field.id, e.target.value)}
                placeholder={field.placeholder || ''}
                className={`${inputClasses} resize-none`}
              />
            )}
          </div>
        ))}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-8 py-4 bg-website-accent text-white font-medium tracking-wide hover:opacity-90 transition-opacity rounded disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : 'Enviar Mensagem'}
        </button>
        <p className="text-xs text-website-stone text-center">
          Seus dados estao protegidos pela LGPD. Responderemos em ate 24 horas.
        </p>
      </form>
    </div>
  )
}
