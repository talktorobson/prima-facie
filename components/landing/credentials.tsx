import { Scale, Shield, TrendingUp, Award } from 'lucide-react'
import ScrollReveal from '@/components/landing/scroll-reveal'

const credentials = [
  { icon: TrendingUp, metric: '2.500+', label: 'Processos Gerenciados' },
  { icon: Shield, metric: '200+', label: 'Empresas Protegidas' },
  { icon: Scale, metric: '98%', label: 'Taxa de Sucesso' },
  { icon: Award, metric: 'OAB/SP', label: 'Registro Ativo' },
]

export default function Credentials() {
  return (
    <section className="py-24 bg-landing-ivory border-t border-landing-mist">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-landing-ink gold-line mx-auto inline-block">
            Confianca Construida em Duas Decadas
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {credentials.map((item, index) => (
            <ScrollReveal key={item.label} delay={`${index * 100}ms`}>
              <div className="bg-landing-charcoal p-8 text-center group hover:scale-[1.02] transition-transform">
                <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center">
                  <item.icon className="h-7 w-7 text-landing-gold" />
                </div>
                <div className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
                  {item.metric}
                </div>
                <div className="w-8 h-[1px] bg-landing-gold mx-auto mb-3" />
                <div className="text-xs uppercase tracking-[0.15em] text-gray-400">
                  {item.label}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
