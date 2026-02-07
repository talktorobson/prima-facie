'use client'

import { useState } from 'react'
import { MapPin, Phone, Mail } from 'lucide-react'

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

  return (
    <section className="py-16 bg-navy-900 border-t border-navy-700">
      <div className="container mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3">
            Entre em Contato
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Agende sua consultoria gratuita e proteja seu negócio hoje mesmo
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="border border-navy-700 rounded-sm bg-navy-800/50 backdrop-blur-sm p-7">
            <h3 className="text-xl font-semibold text-white mb-5">Como podemos ajudar?</h3>
            <form className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  className="w-full h-10 px-3 py-2 text-sm border border-navy-600 bg-navy-800/50 text-white placeholder:text-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">E-mail *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className="w-full h-10 px-3 py-2 text-sm border border-navy-600 bg-navy-800/50 text-white placeholder:text-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Telefone/WhatsApp *
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="(15) 99999-9999"
                    className="w-full h-10 px-3 py-2 text-sm border border-navy-600 bg-navy-800/50 text-white placeholder:text-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Empresa (opcional)
                </label>
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Nome da sua empresa"
                  className="w-full h-10 px-3 py-2 text-sm border border-navy-600 bg-navy-800/50 text-white placeholder:text-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Como podemos ajudar? *
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Descreva sua necessidade jurídica, dúvida ou como podemos ajudar sua empresa..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-navy-600 bg-navy-800/50 text-white placeholder:text-gray-400 rounded-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-navy-900 py-2.5 text-base font-medium rounded-sm transition-colors"
              >
                Enviar Mensagem
              </button>
              <p className="text-xs text-gray-400 text-center">
                Seus dados estão protegidos pela LGPD. Responderemos em até 24 horas.
              </p>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h4 className="text-lg font-semibold text-white mb-2">Atendimento Imediato</h4>
              <p className="text-gray-300 mb-4">Fale conosco agora mesmo pelo WhatsApp</p>
              <a
                href="https://wa.me/551533844013?text=Olá%2C%20gostaria%20de%20agendar%20uma%20consultoria."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded transition-colors"
              >
                Chamar no WhatsApp
              </a>
            </div>

            <div className="border border-navy-700 rounded-sm bg-navy-800/50 backdrop-blur-sm p-7">
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-amber-400 mt-1" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Telefone</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">(15) 3384-4013</p>
                </div>
              </div>
            </div>

            <div className="border border-navy-700 rounded-sm bg-navy-800/50 backdrop-blur-sm p-7">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-amber-400 mt-1" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">E-mail</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    financeiro@davilareisadvogados.com.br
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-navy-700 rounded-sm bg-navy-800/50 backdrop-blur-sm p-7">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-amber-400 mt-1" />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">Endereço</h4>
                  <p className="text-gray-300 text-xs leading-relaxed">
                    Av. Dr. Vinício Gagliardi, 675
                    <br />
                    Centro, Cerquilho/SP
                    <br />
                    CEP: 18520-091
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
