import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { WebsiteContent } from '@/types/website'
import WebsitePageShell from '@/components/website/website-page-shell'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const revalidate = 300

interface PageProps {
  params: { slug: string }
}

async function getData(slug: string) {
  const supabase = createClient()
  const { data: firm } = await supabase
    .from('law_firms')
    .select('id, name, slug, website_published')
    .eq('slug', slug)
    .eq('website_published', true)
    .single()
  if (!firm) return null

  const { data: content } = await supabase
    .from('website_content')
    .select('*')
    .eq('law_firm_id', firm.id)
    .eq('is_published', true)
    .single()
  if (!content) return null

  return { firm, content: content as unknown as WebsiteContent }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getData(params.slug)
  if (!data) return { title: 'Contato' }
  return {
    title: `Contato - ${data.content.seo?.title || data.firm.name}`,
    description: `Entre em contato com ${data.firm.name}`,
  }
}

export default async function ContatoPage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()

  const { content } = data
  const info = content.contact_info

  const contactItems = [
    { icon: Phone, label: 'Telefone', value: info?.phone },
    { icon: Mail, label: 'E-mail', value: info?.email },
    { icon: MapPin, label: 'Endereco', value: info?.address },
    { icon: Clock, label: 'Horario', value: info?.hours },
  ].filter((item) => item.value)

  return (
    <WebsitePageShell content={content} slug={params.slug}>
      <section className="pt-20 py-24 bg-website-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-website-ink mb-4">
              Entre em Contato
            </h1>
            <div className="w-12 h-[2px] bg-website-accent mx-auto mb-6" />
            <p className="text-lg text-website-stone">
              Agende sua consultoria e descubra como podemos ajudar
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact info */}
            <div className="space-y-8">
              {contactItems.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="p-3 bg-website-charcoal rounded">
                      <Icon className="h-5 w-5 text-website-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-website-ink mb-1">{item.label}</h3>
                      <p className="text-website-stone whitespace-pre-line">{item.value}</p>
                    </div>
                  </div>
                )
              })}

              {info?.whatsapp_number && (
                <a
                  href={`https://wa.me/${info.whatsapp_number}?text=${encodeURIComponent(info.whatsapp_message || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-medium text-base tracking-wide hover:bg-green-700 transition-colors rounded"
                >
                  Falar pelo WhatsApp
                </a>
              )}
            </div>

            {/* Contact form */}
            <div className="bg-white border border-website-mist p-8 rounded">
              <h2 className="text-xl font-serif font-semibold text-website-ink mb-6">
                Como podemos ajudar?
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-website-ink mb-1">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 border border-website-mist rounded focus:outline-none focus:border-website-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-website-ink mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 border border-website-mist rounded focus:outline-none focus:border-website-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-website-ink mb-1">Telefone</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border border-website-mist rounded focus:outline-none focus:border-website-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-website-ink mb-1">Mensagem</label>
                  <textarea
                    rows={4}
                    placeholder="Descreva sua necessidade..."
                    className="w-full px-4 py-3 border border-website-mist rounded focus:outline-none focus:border-website-accent resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-8 py-4 bg-website-accent text-white font-medium tracking-wide hover:opacity-90 transition-opacity rounded"
                >
                  Enviar Mensagem
                </button>
                <p className="text-xs text-website-stone text-center">
                  Seus dados estao protegidos pela LGPD. Responderemos em ate 24 horas.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </WebsitePageShell>
  )
}
