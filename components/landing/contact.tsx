'use client'

import { useState } from 'react'
import { MapPin, Phone, Mail, MessageCircle, CheckCircle2 } from 'lucide-react'

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <section id="contato" className="py-20 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-navy-950 mb-6">
            Entre em Contato
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Agende sua consultoria gratuita. Responderemos em até 24 horas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-300">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Envie sua Mensagem</h3>

              {submitted && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900">Mensagem enviada com sucesso!</p>
                    <p className="text-sm text-green-700">Entraremos em contato em breve.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Nome Completo
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Seu nome"
                    className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">E-mail</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Telefone/WhatsApp
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(15) 99999-9999"
                      className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Empresa</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Nome da sua empresa"
                    className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Como podemos ajudar?
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    placeholder="Descreva sua necessidade jurídica ou como podemos ajudar..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  Enviar Mensagem
                </button>

                <p className="text-xs text-gray-600 text-center">
                  Seus dados estão protegidos pela LGPD. Responderemos em até 24 horas.
                </p>
              </form>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/551533844013?text=Olá%2C%20gostaria%20de%20agendar%20uma%20consultoria."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-green-50 border-2 border-green-500 rounded-xl hover:bg-green-100 transition-all duration-300 group"
            >
              <div className="flex-shrink-0">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">WhatsApp</p>
                <p className="text-sm text-gray-600 group-hover:text-gray-700">Atendimento imediato</p>
              </div>
            </a>

            {/* Phone */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300">
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Telefone</h4>
                  <a href="tel:+551533844013" className="text-blue-600 font-semibold hover:text-blue-700">
                    (15) 3384-4013
                  </a>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300">
              <div className="flex items-start gap-4">
                <Mail className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">E-mail</h4>
                  <a href="mailto:financeiro@davilareisadvogados.com.br" className="text-blue-600 font-semibold hover:text-blue-700 text-sm">
                    financeiro@davilareisadvogados<br />.com.br
                  </a>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Endereço</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Av. Dr. Vinício Gagliardi, 675<br />
                    Centro, Cerquilho/SP<br />
                    CEP: 18520-091
                  </p>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="p-6 bg-gray-900 text-white rounded-xl">
              <h4 className="font-semibold mb-3">Horário de Atendimento</h4>
              <div className="space-y-1 text-sm">
                <p>Segunda a Sexta: 8h às 18h</p>
                <p>Sábado: 9h às 13h</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
