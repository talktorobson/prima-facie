'use client'

import { useState, useEffect, useRef, type FormEvent } from 'react'
import { CheckCircle, ArrowLeft, ArrowRight, Send } from 'lucide-react'
import WebsiteScrollReveal from './website-scroll-reveal'
import type { WebsiteContactFormField } from '@/types/website'

interface WebsiteContactFormProps {
  lawFirmId: string
  customFields?: WebsiteContactFormField[]
}

const COMMON_AREAS = [
  'Trabalhista',
  'Civel',
  'Tributario',
  'Empresarial',
  'Imobiliario',
  'Familia',
  'Criminal',
  'Consumidor',
  'Outro',
]

const inputClass =
  'w-full px-4 py-3 bg-white border border-website-mist text-website-ink placeholder:text-website-stone/50 text-sm focus:outline-none focus:border-website-accent transition-colors'

const labelClass = 'block text-xs font-medium text-website-ink mb-1.5'

const STEP_LABELS = ['Area de interesse', 'Dados de contato', 'Detalhes', 'Confirmacao']

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Etapa ${current} de ${total}: ${STEP_LABELS[current - 1] || ''}`}
      className="flex items-center justify-center gap-2 mb-8"
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i + 1 === current
              ? 'w-8 bg-website-accent'
              : i + 1 < current
                ? 'w-2 bg-website-accent/60'
                : 'w-2 bg-website-mist'
          }`}
        />
      ))}
    </div>
  )
}

export default function WebsiteContactForm({ lawFirmId, customFields = [] }: WebsiteContactFormProps) {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const stepContainerRef = useRef<HTMLDivElement>(null)

  // Step 1 — area of interest
  const selectField = customFields.find((f) => f.type === 'select')
  const [selectedArea, setSelectedArea] = useState('')
  const [customSelectValues, setCustomSelectValues] = useState<Record<string, string>>({})

  // Step 2 — contact info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')

  // Step 3 — details
  const textareaFields = customFields.filter((f) => f.type === 'textarea')
  const [customTextValues, setCustomTextValues] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  // Step 4 — confirmation
  const [lgpdConsent, setLgpdConsent] = useState(false)

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const TOTAL_STEPS = 4

  // Focus first focusable element when step changes
  useEffect(() => {
    const container = stepContainerRef.current
    if (!container) return
    const focusable = container.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
    )
    focusable?.focus()
  }, [step])

  // Keyboard navigation: Escape to go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step > 1 && !submitting) {
        goBack()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [step, submitting])

  function goNext() {
    setDirection('forward')
    setStep((s) => s + 1)
  }

  function goBack() {
    setDirection('back')
    setStep((s) => s - 1)
  }

  function canAdvanceStep1() {
    return selectedArea !== ''
  }

  function isValidEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  function isValidPhone(value: string) {
    // Accept Brazilian formats: (XX) XXXXX-XXXX, (XX) XXXX-XXXX, or just digits 10-11
    return /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(value.replace(/\s/g, ''))
  }

  function canAdvanceStep2() {
    return name.trim().length >= 2 && isValidEmail(email) && isValidPhone(phone)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!lgpdConsent) return
    setError('')
    setSubmitting(true)

    const allCustom: Record<string, string> = {}
    if (selectField && selectedArea) {
      allCustom[selectField.id] = selectedArea
    }
    for (const [k, v] of Object.entries(customSelectValues)) {
      allCustom[k] = v
    }
    for (const [k, v] of Object.entries(customTextValues)) {
      allCustom[k] = v
    }
    if (message) {
      allCustom['_message'] = message
    }

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
          custom_fields: Object.keys(allCustom).length > 0 ? allCustom : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao enviar formulario. Tente novamente.')
        return
      }

      setSuccess(true)
    } catch {
      setError('Erro de conexao. Verifique sua internet e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="bg-white border border-website-mist p-8 rounded">
        <WebsiteScrollReveal>
          <div className="text-center py-8 space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-website-ink mb-2">
                Mensagem Enviada!
              </h3>
              <p className="text-sm text-website-stone max-w-sm mx-auto">
                Recebemos sua mensagem e entraremos em contato em breve.
              </p>
            </div>
            <button
              onClick={() => {
                setSuccess(false)
                setStep(1)
                setSelectedArea('')
                setName('')
                setEmail('')
                setPhone('')
                setCompanyName('')
                setCnpj('')
                setMessage('')
                setCustomSelectValues({})
                setCustomTextValues({})
                setLgpdConsent(false)
              }}
              className="text-sm text-website-accent hover:underline"
            >
              Enviar outra mensagem
            </button>
          </div>
        </WebsiteScrollReveal>
      </div>
    )
  }

  const animClass =
    direction === 'forward'
      ? 'animate-[slideInRight_300ms_ease-out]'
      : 'animate-[slideInLeft_300ms_ease-out]'

  const areaOptions = selectField ? (selectField.options || []) : COMMON_AREAS

  return (
    <div ref={stepContainerRef} className="bg-white border border-website-mist p-8 rounded">
      <h2 className="text-xl font-serif font-semibold text-website-ink mb-6">
        Como podemos ajudar?
      </h2>

      <ProgressDots current={step} total={TOTAL_STEPS} />

      <div className="sr-only" role="status" aria-live="polite">
        Etapa {step} de {TOTAL_STEPS}: {STEP_LABELS[step - 1]}
      </div>

      {/* Step 1 — Area de interesse */}
      {step === 1 && (
        <div key="step1" className={animClass}>
          <div className="mb-5">
            <h3 className="text-lg font-serif font-semibold text-website-ink mb-1">
              Area de interesse
            </h3>
            <p className="text-sm text-website-stone">Selecione a area da sua necessidade.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {areaOptions.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => {
                  setSelectedArea(area)
                  if (selectField) {
                    setCustomSelectValues((prev) => ({ ...prev, [selectField.id]: area }))
                  }
                }}
                className={`px-4 py-3 text-sm font-medium border transition-colors text-center ${
                  selectedArea === area
                    ? 'border-website-accent bg-website-accent/10 text-website-accent'
                    : 'border-website-mist text-website-stone hover:border-website-accent/50'
                }`}
              >
                {area}
              </button>
            ))}
          </div>

          {/* Non-select custom fields for step 1 (extra selects) */}
          {customFields
            .filter((f) => f.type === 'select' && f.id !== selectField?.id)
            .map((field) => (
              <div key={field.id} className="mb-4">
                <label className={labelClass}>
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                <select
                  value={customSelectValues[field.id] || ''}
                  onChange={(e) =>
                    setCustomSelectValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  className={inputClass}
                >
                  <option value="">{field.placeholder || 'Selecione...'}</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}

          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvanceStep1()}
            className="w-full bg-website-accent text-white py-3.5 text-sm font-medium tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Proximo
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 2 — Contact info */}
      {step === 2 && (
        <div key="step2" className={animClass}>
          <div className="mb-5">
            <h3 className="text-lg font-serif font-semibold text-website-ink mb-1">
              Seus dados de contato
            </h3>
            <p className="text-sm text-website-stone">Como podemos entrar em contato?</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className={labelClass}>
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                E-mail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={inputClass}
              />
              {email && !isValidEmail(email) && (
                <p className="text-xs text-red-500 mt-1">Informe um e-mail valido</p>
              )}
            </div>
            <div>
              <label className={labelClass}>
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className={inputClass}
              />
              {phone && !isValidPhone(phone) && (
                <p className="text-xs text-red-500 mt-1">Informe um telefone valido: (XX) XXXXX-XXXX</p>
              )}
            </div>
            <div>
              <label className={labelClass}>Empresa</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Nome da empresa (opcional)"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0000-00 (opcional)"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex-1 border border-website-mist text-website-stone py-3.5 text-sm font-medium hover:border-website-ink hover:text-website-ink transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!canAdvanceStep2()}
              className="flex-1 bg-website-accent text-white py-3.5 text-sm font-medium tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Proximo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Details */}
      {step === 3 && (
        <div key="step3" className={animClass}>
          <div className="mb-5">
            <h3 className="text-lg font-serif font-semibold text-website-ink mb-1">
              Detalhes
            </h3>
            <p className="text-sm text-website-stone">Conte-nos mais sobre sua necessidade.</p>
          </div>

          <div className="space-y-4 mb-6">
            {textareaFields.map((field) => (
              <div key={field.id}>
                <label className={labelClass}>
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                <textarea
                  rows={4}
                  value={customTextValues[field.id] || ''}
                  onChange={(e) =>
                    setCustomTextValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  placeholder={field.placeholder || ''}
                  className={`${inputClass} resize-none`}
                />
              </div>
            ))}
            <div>
              <label className={labelClass}>Mensagem</label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva brevemente sua situacao..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              className="flex-1 border border-website-mist text-website-stone py-3.5 text-sm font-medium hover:border-website-ink hover:text-website-ink transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex-1 bg-website-accent text-white py-3.5 text-sm font-medium tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Proximo
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Confirmation */}
      {step === 4 && (
        <div key="step4" className={animClass}>
          <div className="mb-5">
            <h3 className="text-lg font-serif font-semibold text-website-ink mb-1">
              Confirmacao
            </h3>
            <p className="text-sm text-website-stone">Revise e confirme o envio.</p>
          </div>

          <div className="space-y-3 mb-6 p-4 bg-website-bg/50 border border-website-mist rounded text-sm">
            <div className="flex justify-between">
              <span className="text-website-stone">Area:</span>
              <span className="text-website-ink font-medium">{selectedArea}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-website-stone">Nome:</span>
              <span className="text-website-ink font-medium">{name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-website-stone">E-mail:</span>
              <span className="text-website-ink font-medium">{email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-website-stone">Telefone:</span>
              <span className="text-website-ink font-medium">{phone}</span>
            </div>
            {companyName && (
              <div className="flex justify-between">
                <span className="text-website-stone">Empresa:</span>
                <span className="text-website-ink font-medium">{companyName}</span>
              </div>
            )}
            {message && (
              <div className="pt-2 border-t border-website-mist">
                <span className="text-website-stone">Mensagem:</span>
                <p className="text-website-ink mt-1">{message}</p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <label className="flex items-start gap-3 cursor-pointer mb-6">
              <input
                type="checkbox"
                checked={lgpdConsent}
                onChange={(e) => setLgpdConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 border-website-mist text-website-accent focus:ring-website-accent"
              />
              <span className="text-sm text-website-ink">
                Li e aceito a Politica de Privacidade e autorizo o tratamento dos meus dados
                para atendimento conforme a LGPD. *
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded mb-4">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={submitting}
                className="flex-1 border border-website-mist text-website-stone py-3.5 text-sm font-medium hover:border-website-ink hover:text-website-ink transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
              <button
                type="submit"
                disabled={submitting || !lgpdConsent}
                aria-busy={submitting}
                className="flex-1 bg-website-accent text-white py-3.5 text-sm font-medium tracking-wide hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-website-stone text-center mt-4">
              Seus dados estao protegidos pela LGPD. Responderemos em ate 24 horas.
            </p>
          </form>
        </div>
      )}
    </div>
  )
}
