import Link from 'next/link'
import ScrollReveal from '@/components/landing/scroll-reveal'
import { MapPin } from 'lucide-react'

export default function CoverageRegion() {
  return (
    <section className="py-24 bg-landing-ivory">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center">
            <MapPin className="h-8 w-8 text-landing-gold mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-landing-ink mb-8">
              Interior de Sao Paulo
            </h2>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-8" />
            <p className="text-lg text-landing-stone leading-relaxed mb-4">
              Nosso escritorio esta sediado em Cerquilho/SP e atende empresas em todo o eixo
              Sorocaba — Campinas — Piracicaba, incluindo Tatui, Tiete, Indaiatuba e cidades vizinhas.
            </p>
            <p className="text-landing-stone leading-relaxed mb-10">
              Atuamos tambem em demandas em todo o Estado de Sao Paulo e, para casos especificos,
              em outros estados via correspondentes credenciados.
            </p>
            <Link
              href="/area-de-atuacao"
              className="inline-flex items-center justify-center px-8 py-4 border border-landing-ink text-landing-ink font-medium text-base tracking-wide hover:bg-landing-ink hover:text-white transition-colors"
            >
              Ver area de atuacao
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
