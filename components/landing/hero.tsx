import Link from 'next/link'
import { Scale, Phone, Mail, ArrowRight, Users } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-navy-950 text-white">
      {/* Header */}
      <header className="container mx-auto px-4 sm:px-6 pt-6 sm:pt-8 flex justify-between items-center mb-6 sm:mb-8">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500 rounded-lg flex items-center justify-center">
            <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-navy-900" />
          </div>
          <h1 className="text-lg sm:text-2xl font-bold tracking-wide text-white">
            D&apos;Avila Reis Advogados
          </h1>
        </div>

        {/* Desktop Contact Info - Hidden on mobile */}
        <div className="hidden lg:flex items-center space-x-8">
          <div className="flex items-center space-x-2 text-gray-300">
            <Phone className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium">(15) 3384-4013</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-300">
            <Mail className="h-4 w-4 text-amber-400" />
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-16 flex items-center min-h-[calc(100vh-120px)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 sm:mb-8 leading-tight text-white">
            Protegemos Seu Negócio.
          </h2>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-6 sm:mb-8 text-amber-400">
            Blindamos Seu Patrimônio.
          </h3>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-8 sm:mb-12 text-gray-300 leading-relaxed max-w-3xl mx-auto px-2">
            20 anos especializados em direito empresarial e trabalhista preventivo.
            Defendemos empresários contra processos que podem atingir seu patrimônio pessoal.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-navy-900 font-bold px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-lg shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 sm:gap-3"
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Acessar Portal do Cliente
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>

            <button
              type="button"
              className="w-full sm:w-auto border-2 border-white text-white font-semibold px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-lg hover:bg-white hover:text-navy-900 transition-all duration-200"
            >
              Consultoria Gratuita
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mt-8 sm:mt-16 px-2">
            <div className="text-center bg-navy-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-navy-700/30">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-400 mb-1 sm:mb-2">2.500+</div>
              <div className="text-gray-300 text-xs sm:text-sm uppercase tracking-wide font-medium">Processos Gerenciados</div>
            </div>
            <div className="text-center bg-navy-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-navy-700/30">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-400 mb-1 sm:mb-2">200+</div>
              <div className="text-gray-300 text-xs sm:text-sm uppercase tracking-wide font-medium">Clientes Protegidos</div>
            </div>
            <div className="text-center bg-navy-800/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-navy-700/30">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-amber-400 mb-1 sm:mb-2">20</div>
              <div className="text-gray-300 text-xs sm:text-sm uppercase tracking-wide font-medium">Anos no Mercado</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
