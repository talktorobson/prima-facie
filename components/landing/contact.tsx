'use client'

import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import ScrollReveal from '@/components/landing/scroll-reveal'

const contactInfo = [
  {
    icon: Phone,
    title: 'Telefone',
    detail: '(15) 3384-4013',
  },
  {
    icon: Mail,
    title: 'E-mail',
    detail: 'financeiro@davilareisadvogados.com.br',
  },
  {
    icon: MapPin,
    title: 'Endereco',
    detail: 'Av. Dr. Vinicio Gagliardi, 675\nCentro, Cerquilho/SP — CEP 18520-091',
  },
  {
    icon: Clock,
    title: 'Horario',
    detail: 'Seg a Sex, 8h as 18h',
  },
]

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const inputClass =
    'w-full px-4 py-3 bg-white border border-landing-mist text-landing-ink placeholder:text-landing-stone/50 text-sm focus:outline-none focus:border-landing-gold transition-colors'

  return (
    <section id="contato" className="py-24 bg-landing-mist/40">
      <div className="container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-landing-ink gold-line mx-auto inline-block">
              Entre em Contato
            </h2>
            <p className="text-landing-stone mt-8 text-lg max-w-2xl mx-auto">
              Agende sua consultoria e descubra como podemos proteger seu negocio
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Left: info cards */}
          <ScrollReveal>
            <div className="space-y-6">
              {contactInfo.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-5 bg-white border border-landing-mist/60"
                >
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-5 w-5 text-landing-gold" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-landing-ink mb-1">{item.title}</h4>
                    <p className="text-sm text-landing-stone whitespace-pre-line">{item.detail}</p>
                  </div>
                </div>
              ))}

              <a
                href="https://wa.me/551533844013?text=Ola%2C%20gostaria%20de%20agendar%20uma%20consultoria."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 border border-landing-ink text-landing-ink text-sm font-medium hover:bg-landing-ink hover:text-white transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Chamar no WhatsApp
              </a>
            </div>
          </ScrollReveal>

          {/* Right: form */}
          <ScrollReveal delay="100ms">
            <form className="bg-white border border-landing-mist/60 p-8 md:p-10">
              <h3 className="text-xl font-serif font-semibold text-landing-ink mb-6">
                Como podemos ajudar?
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-landing-ink mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-landing-ink mb-1.5">
                      E-mail *
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-landing-ink mb-1.5">
                      Telefone *
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(15) 99999-9999"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-landing-ink mb-1.5">
                    Empresa <span className="text-landing-stone">(opcional)</span>
                  </label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Nome da sua empresa"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-landing-ink mb-1.5">
                    Mensagem *
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Descreva sua necessidade juridica..."
                    rows={4}
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-landing-gold text-white py-3.5 text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors"
                >
                  Enviar Mensagem
                </button>
                <p className="text-xs text-landing-stone text-center">
                  Seus dados estao protegidos pela LGPD. Responderemos em ate 24 horas.
                </p>
              </div>
            </form>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
