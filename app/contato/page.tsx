import type { Metadata } from 'next'
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import PublicPageShell from '@/components/landing/public-page-shell'
import ContactTriageForm from '@/components/landing/contact-triage-form'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: 'Contato | D\'Avila Reis Advogados',
  description: 'Entre em contato com o escritorio D\'Avila Reis Advogados. Advocacia empresarial e trabalhista preventiva em Cerquilho/SP.',
}

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

export default function ContatoPage() {
  return (
    <PublicPageShell>
      <main>
        <section className="py-24 bg-landing-mist/40">
          <div className="container mx-auto px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-landing-ink gold-line mx-auto inline-block">
                  Entre em Contato
                </h1>
                <p className="text-landing-stone mt-8 text-lg max-w-2xl mx-auto">
                  Preencha o formulario para direcionarmos seu atendimento de forma agil e personalizada.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Left: Contact info cards */}
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

              {/* Right: Triage form */}
              <ScrollReveal delay="100ms">
                <ContactTriageForm />
              </ScrollReveal>
            </div>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
