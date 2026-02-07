'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { CheckCircle, ArrowLeft, ArrowRight, Send, ExternalLink } from 'lucide-react'
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  type Step1Data,
  type Step2Data,
  type Step3Data,
  type Step4Data,
  type Step5Data,
  type ContactFormData,
} from '@/lib/schemas/contact-form-schema'

const TOTAL_STEPS = 5

const inputClass =
  'w-full px-4 py-3 bg-white border border-landing-mist text-landing-ink placeholder:text-landing-stone/50 text-sm focus:outline-none focus:border-landing-gold transition-colors'

const selectClass =
  'w-full px-4 py-3 bg-white border border-landing-mist text-landing-ink text-sm focus:outline-none focus:border-landing-gold transition-colors appearance-none cursor-pointer'

const labelClass = 'block text-xs font-medium text-landing-ink mb-1.5'

const errorClass = 'text-xs text-red-600 mt-1'

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${i + 1 === current
              ? 'w-8 bg-landing-gold'
              : i + 1 < current
                ? 'w-2 bg-landing-gold/60'
                : 'w-2 bg-landing-mist'
            }`}
        />
      ))}
    </div>
  )
}

// --- Step components ---

function PreGate({ onContinue }: { onContinue: () => void }) {
  const [isClient, setIsClient] = useState<boolean | null>(null)
  const [isCompany, setIsCompany] = useState<boolean | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-serif font-semibold text-landing-ink mb-2">
          Antes de começar...
        </h3>
        <p className="text-sm text-landing-stone">
          Responda duas perguntas rápidas para direcionarmos seu atendimento.
        </p>
      </div>

      {/* Question 1: Already a client? */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-landing-ink">Já é cliente do escritório?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setIsClient(true)}
            className={`flex-1 px-4 py-3 text-sm font-medium border transition-colors ${isClient === true
                ? 'border-landing-gold bg-landing-gold/10 text-landing-gold'
                : 'border-landing-mist text-landing-stone hover:border-landing-gold/50'
              }`}
          >
            Sim
          </button>
          <button
            type="button"
            onClick={() => setIsClient(false)}
            className={`flex-1 px-4 py-3 text-sm font-medium border transition-colors ${isClient === false
                ? 'border-landing-gold bg-landing-gold/10 text-landing-gold'
                : 'border-landing-mist text-landing-stone hover:border-landing-gold/50'
              }`}
          >
            Não
          </button>
        </div>
        {isClient === true && (
          <div className="p-4 bg-landing-gold/5 border border-landing-gold/20">
            <p className="text-sm text-landing-ink mb-2">
              Acesse o Portal do Cliente para acompanhar seus processos e enviar mensagens.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-landing-gold hover:text-landing-gold-light transition-colors"
            >
              Acessar Portal do Cliente
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Question 2: Is a company? */}
      {isClient === false && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-landing-ink">Você é empresário ou representa uma empresa?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsCompany(true)}
              className={`flex-1 px-4 py-3 text-sm font-medium border transition-colors ${isCompany === true
                  ? 'border-landing-gold bg-landing-gold/10 text-landing-gold'
                  : 'border-landing-mist text-landing-stone hover:border-landing-gold/50'
                }`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setIsCompany(false)}
              className={`flex-1 px-4 py-3 text-sm font-medium border transition-colors ${isCompany === false
                  ? 'border-landing-gold bg-landing-gold/10 text-landing-gold'
                  : 'border-landing-mist text-landing-stone hover:border-landing-gold/50'
                }`}
            >
              Não, sou pessoa física
            </button>
          </div>
          {isCompany === false && (
            <div className="p-4 bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                Nosso escritório é especializado em atendimento a empresas. Para demandas de pessoa
                física, recomendamos procurar um advogado especialista na área desejada.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Continue button */}
      {isClient === false && isCompany === true && (
        <button
          type="button"
          onClick={onContinue}
          className="w-full bg-landing-gold text-white py-3.5 text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors flex items-center justify-center gap-2"
        >
          Iniciar formulário
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function Step1Form({
  onNext,
  defaultValues,
}: {
  onNext: (data: Step1Data) => void
  defaultValues?: Partial<Step1Data>
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h3 className="text-lg font-serif font-semibold text-landing-ink mb-1">
          Qual o assunto?
        </h3>
        <p className="text-sm text-landing-stone mb-5">Selecione a área da sua necessidade.</p>
      </div>

      <div>
        <label className={labelClass}>Assunto *</label>
        <select {...register('subject')} className={selectClass}>
          <option value="">Selecione...</option>
          <option value="trabalhista">Trabalhista</option>
          <option value="contratos">Contratos</option>
          <option value="cobranca">Cobrança</option>
          <option value="consultoria">Consultoria Empresarial</option>
          <option value="outro">Outro</option>
        </select>
        {errors.subject && <p className={errorClass}>{errors.subject.message}</p>}
      </div>

      <div>
        <label className={labelClass}>
          Cidade / UF <span className="text-landing-stone">(opcional)</span>
        </label>
        <input
          {...register('city')}
          placeholder="Ex: Cerquilho/SP"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          Função na empresa <span className="text-landing-stone">(opcional)</span>
        </label>
        <select {...register('role')} className={selectClass}>
          <option value="">Selecione...</option>
          <option value="socio">Sócio / Proprietário</option>
          <option value="diretor">Diretor / Gerente</option>
          <option value="rh">Recursos Humanos</option>
          <option value="financeiro">Financeiro</option>
          <option value="outro">Outro</option>
        </select>
      </div>

      <button
        type="submit"
        className="w-full bg-landing-gold text-white py-3.5 text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors flex items-center justify-center gap-2"
      >
        Próximo
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  )
}

function Step2Form({
  onNext,
  onBack,
  defaultValues,
}: {
  onNext: (data: Step2Data) => void
  onBack: () => void
  defaultValues?: Partial<Step2Data>
}) {
  const { register, handleSubmit } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h3 className="text-lg font-serif font-semibold text-landing-ink mb-1">
          Sobre a empresa
        </h3>
        <p className="text-sm text-landing-stone mb-5">
          Informações opcionais para melhor direcionamento.
        </p>
      </div>

      <div>
        <label className={labelClass}>
          Razão Social <span className="text-landing-stone">(opcional)</span>
        </label>
        <input
          {...register('company_name')}
          placeholder="Nome da empresa"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          CNPJ <span className="text-landing-stone">(opcional)</span>
        </label>
        <input
          {...register('cnpj')}
          placeholder="00.000.000/0000-00"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          Número de colaboradores <span className="text-landing-stone">(opcional)</span>
        </label>
        <select {...register('employee_count')} className={selectClass}>
          <option value="">Selecione...</option>
          <option value="1-10">1 a 10</option>
          <option value="11-50">11 a 50</option>
          <option value="51-200">51 a 200</option>
          <option value="200+">Mais de 200</option>
        </select>
      </div>

      <div>
        <label className={labelClass}>
          Segmento <span className="text-landing-stone">(opcional)</span>
        </label>
        <input
          {...register('segment')}
          placeholder="Ex: Industria, Comércio, Serviços..."
          className={inputClass}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-landing-mist text-landing-stone py-3.5 text-sm font-medium hover:border-landing-ink hover:text-landing-ink transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="submit"
          className="flex-1 bg-landing-gold text-white py-3.5 text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors flex items-center justify-center gap-2"
        >
          Próximo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}

function Step3Form({
  onNext,
  onBack,
  defaultValues,
}: {
  onNext: (data: Step3Data) => void
  onBack: () => void
  defaultValues?: Partial<Step3Data>
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h3 className="text-lg font-serif font-semibold text-landing-ink mb-1">
          Urgência e detalhes
        </h3>
        <p className="text-sm text-landing-stone mb-5">
          Nos ajude a priorizar seu atendimento.
        </p>
      </div>

      <div>
        <label className={labelClass}>Urgencia *</label>
        <select {...register('urgency')} className={selectClass}>
          <option value="">Selecione...</option>
          <option value="urgente">Urgente (preciso de resposta imediata)</option>
          <option value="normal">Normal (posso aguardar alguns dias)</option>
          <option value="consulta">Apenas consulta (sem prazo)</option>
        </select>
        {errors.urgency && <p className={errorClass}>{errors.urgency.message}</p>}
      </div>

      <div>
        <label className={labelClass}>
          Descreva resumidamente sua demanda{' '}
          <span className="text-landing-stone">(opcional)</span>
        </label>
        <textarea
          {...register('details.description')}
          placeholder="Conte-nos um pouco sobre a situacao..."
          rows={4}
          className={inputClass}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-landing-mist text-landing-stone py-3.5 text-sm font-medium hover:border-landing-ink hover:text-landing-ink transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="submit"
          className="flex-1 bg-landing-gold text-white py-3.5 text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors flex items-center justify-center gap-2"
        >
          Proximo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}

function Step4Form({
  onNext,
  onBack,
  defaultValues,
}: {
  onNext: (data: Step4Data) => void
  onBack: () => void
  defaultValues?: Partial<Step4Data>
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <h3 className="text-lg font-serif font-semibold text-landing-ink mb-1">
          Seus dados de contato
        </h3>
        <p className="text-sm text-landing-stone mb-5">
          Como podemos entrar em contato com você?
        </p>
      </div>

      <div>
        <label className={labelClass}>Nome Completo *</label>
        <input
          {...register('name')}
          placeholder="Seu nome completo"
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>E-mail *</label>
          <input
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            className={inputClass}
          />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Telefone *</label>
          <input
            {...register('phone')}
            placeholder="(15) 99999-9999"
            className={inputClass}
          />
          {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Canal preferido <span className="text-landing-stone">(opcional)</span>
          </label>
          <select {...register('preferred_channel')} className={selectClass}>
            <option value="">Selecione...</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
            <option value="telefone">Telefone</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>
            Horário preferido <span className="text-landing-stone">(opcional)</span>
          </label>
          <select {...register('preferred_time')} className={selectClass}>
            <option value="">Selecione...</option>
            <option value="manha">Manhã (8h-12h)</option>
            <option value="tarde">Tarde (13h-18h)</option>
            <option value="sem_preferencia">Sem preferencia</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-landing-mist text-landing-stone py-3.5 text-sm font-medium hover:border-landing-ink hover:text-landing-ink transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="submit"
          className="flex-1 bg-landing-gold text-white py-3.5 text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors flex items-center justify-center gap-2"
        >
          Próximo
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  )
}

function Step5Form({
  onSubmit,
  onBack,
  isSubmitting,
  defaultValues,
}: {
  onSubmit: (data: Step5Data) => void
  onBack: () => void
  isSubmitting: boolean
  defaultValues?: Partial<Step5Data>
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      privacy_consent: undefined,
      marketing_consent: false,
      ...defaultValues,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h3 className="text-lg font-serif font-semibold text-landing-ink mb-1">
          Confirmação
        </h3>
        <p className="text-sm text-landing-stone mb-5">
          Revise e confirme o envio do formulário.
        </p>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('privacy_consent')}
            className="mt-0.5 h-4 w-4 border-landing-mist text-landing-gold focus:ring-landing-gold"
          />
          <span className="text-sm text-landing-ink">
            Li e aceito a{' '}
            <Link
              href="/politica-de-privacidade"
              target="_blank"
              className="text-landing-gold hover:text-landing-gold-light underline"
            >
              Politica de Privacidade
            </Link>{' '}
            e autorizo o tratamento dos meus dados para atendimento. *
          </span>
        </label>
        {errors.privacy_consent && (
          <p className={errorClass}>{errors.privacy_consent.message}</p>
        )}

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            {...register('marketing_consent')}
            className="mt-0.5 h-4 w-4 border-landing-mist text-landing-gold focus:ring-landing-gold"
          />
          <span className="text-sm text-landing-stone">
            Desejo receber alertas jurídicos, novidades e conteúdos do escritório por e-mail.
          </span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 border border-landing-mist text-landing-stone py-3.5 text-sm font-medium hover:border-landing-ink hover:text-landing-ink transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-landing-gold text-white py-3.5 text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
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

      <p className="text-xs text-landing-stone text-center">
        Seus dados estão protegidos pela LGPD. Responderemos em até 24 horas.
      </p>
    </form>
  )
}

function SuccessState() {
  return (
    <div className="text-center py-8 space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-600" />
      </div>
      <div>
        <h3 className="text-xl font-serif font-semibold text-landing-ink mb-2">
          Mensagem enviada com sucesso!
        </h3>
        <p className="text-sm text-landing-stone max-w-sm mx-auto">
          Recebemos sua solicitação e entraremos em contato em até 24 horas úteis pelo canal
          de sua preferência.
        </p>
      </div>
      <div className="pt-2">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 border border-landing-ink text-landing-ink text-sm font-medium hover:bg-landing-ink hover:text-white transition-colors"
        >
          Acessar Portal do Cliente
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

// --- Main form orchestrator ---

export default function ContactTriageForm() {
  const [step, setStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Accumulated form data across steps
  const [formData, setFormData] = useState<Partial<ContactFormData>>({})

  function mergeAndAdvance(stepData: Record<string, unknown>) {
    setFormData((prev) => ({ ...prev, ...stepData }))
    setStep((prev) => prev + 1)
  }

  function goBack() {
    setStep((prev) => prev - 1)
  }

  async function handleFinalSubmit(step5Data: Step5Data) {
    setIsSubmitting(true)
    setSubmitError(null)

    const payload: ContactFormData = {
      subject: formData.subject!,
      city: formData.city,
      role: formData.role,
      company_name: formData.company_name,
      cnpj: formData.cnpj,
      employee_count: formData.employee_count,
      segment: formData.segment,
      urgency: formData.urgency!,
      details: formData.details,
      name: formData.name!,
      email: formData.email!,
      phone: formData.phone!,
      preferred_channel: formData.preferred_channel,
      preferred_time: formData.preferred_time,
      marketing_consent: step5Data.marketing_consent,
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Erro ao enviar formulario')
      }

      setIsSuccess(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-white border border-landing-mist/60 p-8 md:p-10">
        <SuccessState />
      </div>
    )
  }

  return (
    <div className="bg-white border border-landing-mist/60 p-8 md:p-10">
      {step > 0 && step <= TOTAL_STEPS && <ProgressDots current={step} total={TOTAL_STEPS} />}

      {step === 0 && <PreGate onContinue={() => setStep(1)} />}

      {step === 1 && (
        <Step1Form
          onNext={(data) => mergeAndAdvance(data)}
          defaultValues={{
            subject: formData.subject,
            city: formData.city,
            role: formData.role,
          }}
        />
      )}

      {step === 2 && (
        <Step2Form
          onNext={(data) => mergeAndAdvance(data)}
          onBack={goBack}
          defaultValues={{
            company_name: formData.company_name,
            cnpj: formData.cnpj,
            employee_count: formData.employee_count,
            segment: formData.segment,
          }}
        />
      )}

      {step === 3 && (
        <Step3Form
          onNext={(data) => mergeAndAdvance(data)}
          onBack={goBack}
          defaultValues={{
            urgency: formData.urgency,
            details: formData.details,
          }}
        />
      )}

      {step === 4 && (
        <Step4Form
          onNext={(data) => mergeAndAdvance(data)}
          onBack={goBack}
          defaultValues={{
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            preferred_channel: formData.preferred_channel,
            preferred_time: formData.preferred_time,
          }}
        />
      )}

      {step === 5 && (
        <Step5Form
          onSubmit={handleFinalSubmit}
          onBack={goBack}
          isSubmitting={isSubmitting}
          defaultValues={{
            marketing_consent: formData.marketing_consent,
          }}
        />
      )}

      {submitError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700">
          {submitError}
        </div>
      )}
    </div>
  )
}
