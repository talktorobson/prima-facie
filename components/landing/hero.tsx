import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-white via-blue-50 to-gray-50 pt-24 pb-12">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50/50 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 sm:px-6 flex items-center min-h-[calc(100vh-96px)]">
        <div className="max-w-5xl mx-auto w-full">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold border border-blue-200">
              <CheckCircle2 className="h-4 w-4" />
              20 Anos Protegendo Empresários Brasileiros
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-navy-950 mb-6 leading-tight text-center">
            Estratégia Jurídica que Protege Seu Negócio
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto text-center">
            Consultoria especializada em direito empresarial e trabalhista. Blindagem patrimonial, defesa estratégica e compliance para sua segurança jurídica.
          </p>

          {/* Trust Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Consultoria Preventiva</h3>
                <p className="text-sm text-gray-600">Antes de problemas ocorrerem</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Defesa Especializada</h3>
                <p className="text-sm text-gray-600">Quando você precisa de ajuda</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900">Portal 24/7</h3>
                <p className="text-sm text-gray-600">Acompanhamento total do seu caso</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              Acessar Portal
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              type="button"
              className="px-8 py-4 border-2 border-gray-300 text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              Consultoria Gratuita
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-200">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">2.500+</div>
              <p className="text-gray-600 font-medium">Processos Gerenciados com Sucesso</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">200+</div>
              <p className="text-gray-600 font-medium">Empresários Protegidos</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">20</div>
              <p className="text-gray-600 font-medium">Anos de Experiência</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
