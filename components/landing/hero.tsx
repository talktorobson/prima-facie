import Link from 'next/link'
import Header from '@/components/landing/header'
import Topbar from '@/components/landing/topbar'

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-landing-ivory grain">
      <Topbar />
      <Header variant="transparent" />

      {/* Hero content */}
      <div className="container mx-auto px-4 sm:px-6 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[70vh]">
          {/* Left: text */}
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-landing-ink leading-[1.1] mb-6">
              Protegemos Seu{' '}
              <span className="block">Negocio.</span>
              <span className="block text-landing-gold">Blindamos Seu</span>
              <span className="block text-landing-gold">Patrimonio.</span>
            </h1>

            {/* Gold separator */}
            <div className="w-16 h-[2px] bg-landing-gold mb-8" />

            <p className="text-lg md:text-xl text-landing-stone leading-relaxed max-w-lg mb-10">
              Ha mais de 20 anos atuamos na defesa de empresas em demandas trabalhistas (lado patronal),
              elaboracao e revisao de contratos empresariais e cobranca e recuperacao de credito.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contato"
                className="inline-flex items-center justify-center px-8 py-4 bg-landing-gold text-white font-medium text-base tracking-wide hover:bg-landing-gold-light transition-colors"
              >
                Agendar reuniao inicial
              </Link>
              <Link
                href="https://wa.me/551533844013?text=Ola%2C%20gostaria%20de%20agendar%20uma%20reuniao."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 border border-landing-ink text-landing-ink font-medium text-base tracking-wide hover:bg-landing-ink hover:text-white transition-colors"
              >
                Falar com a equipe
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-4 text-landing-ink font-medium text-base tracking-wide hover:text-landing-gold transition-colors"
              >
                Portal do Cliente
              </Link>
            </div>

            {/* Microcopy */}
            <p className="text-xs text-landing-stone mt-4">
              Atendemos exclusivamente pessoas juridicas (empresas).
            </p>
          </div>

          {/* Right: architectural image */}
          <div className="hidden lg:block relative">
            <div className="aspect-[3/4] relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop"
                alt="Escritorio moderno"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-landing-ink/10" />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 pt-12 border-t border-landing-mist">
          {[
            { number: '2.500+', label: 'Processos Gerenciados' },
            { number: '200+', label: 'Empresas Protegidas' },
            { number: '20', label: 'Anos de Experiencia' },
          ].map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <div className="text-4xl md:text-5xl font-serif font-bold text-landing-ink mb-2">
                {stat.number}
              </div>
              <div className="text-xs uppercase tracking-[0.2em] text-landing-stone">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
