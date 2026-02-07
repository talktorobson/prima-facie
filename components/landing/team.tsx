import { Briefcase, Award, Heart } from 'lucide-react'

export default function Team() {
  return (
    <section id="equipe" className="py-20 bg-gray-50 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-navy-950 mb-6">
            Expertise Reconhecida
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Uma equipe que combina décadas de experiência com conhecimento especializado em direito
            empresarial e trabalhista
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Founder Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="flex flex-col md:flex-row">
              {/* Left - Image Placeholder */}
              <div className="md:w-1/3 bg-gradient-to-br from-blue-100 to-blue-50 p-8 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                  DR
                </div>
              </div>

              {/* Right - Info */}
              <div className="md:w-2/3 p-8 flex flex-col justify-center">
                <div className="inline-block w-fit mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    Sócio-Fundador
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Dr. Robson D'Avila Reis</h3>
                <p className="text-blue-600 font-semibold mb-4">OAB/SP nº XXXXX</p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Experiência</p>
                      <p className="text-gray-600 text-sm">Mais de 20 anos em direito trabalhista e empresarial</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Especialização</p>
                      <p className="text-gray-600 text-sm">Defesa de empresários e blindagem patrimonial</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-900">Compromisso</p>
                      <p className="text-gray-600 text-sm">Dedicado à proteção do patrimônio dos clientes</p>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700 leading-relaxed">
                  Fundador com trajetória consolidada no mercado jurídico, reconhecido pela excelência em consultoria preventiva e defesa estratégica. Desenvolve soluções personalizadas para empresas que buscam segurança jurídica.
                </p>
              </div>
            </div>
          </div>

          {/* Qualifications */}
          <div className="mt-12 pt-12 border-t border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-6 text-center">Formação e Credenciais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">Educação</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Bacharelado em Direito</li>
                  <li>• Especialização em Direito Trabalhista</li>
                  <li>• Formação Continuada em Compliance</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="font-semibold text-gray-900 mb-2">Membros e Certificações</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• OAB - Ordem dos Advogados do Brasil</li>
                  <li>• Associações Profissionais Jurídicas</li>
                  <li>• Formação em Mediação e Arbitragem</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
