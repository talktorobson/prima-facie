import Link from 'next/link'
import { Shield, Scale, Users, FileText, ArrowRight } from 'lucide-react'

const services = [
  {
    icon: Shield,
    title: 'Consultoria Preventiva',
    description:
      'Auditoria completa dos seus processos trabalhistas, criação de políticas internas e treinamento de equipes para prevenir litígios.',
    highlight: false,
  },
  {
    icon: Scale,
    title: 'Defesa Estratégica',
    description:
      'Representação especializada em processos trabalhistas com foco na proteção do patrimônio empresarial e pessoal.',
    highlight: false,
  },
  {
    icon: Users,
    title: 'Portal do Cliente 24/7',
    description:
      'Acompanhe seus processos online com total transparência. Acesso exclusivo ao andamento dos seus casos, documentos e comunicação direta.',
    highlight: true,
  },
  {
    icon: FileText,
    title: 'Compliance Trabalhista',
    description:
      'Implementação de sistemas de compliance para garantir conformidade com a legislação e reduzir riscos significativamente.',
    highlight: false,
  },
]

export default function Services() {
  return (
    <section className="py-20 bg-navy-800">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Nossa Metodologia de Blindagem Empresarial
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Estratégias preventivas e defensivas para proteger sua empresa e patrimônio pessoal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div
              key={index}
              className={`shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden ${
                service.highlight
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-navy-900'
                  : 'bg-navy-900/50 backdrop-blur-sm border border-navy-600/30'
              }`}
            >
              <div className="p-6 pb-4">
                <div className="flex items-center mb-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 ${
                      service.highlight ? 'bg-navy-900/20' : 'bg-amber-500/20'
                    }`}
                  >
                    <service.icon
                      className={`h-6 w-6 ${
                        service.highlight ? 'text-navy-900' : 'text-amber-400'
                      }`}
                    />
                  </div>
                  <h3
                    className={`text-2xl font-semibold ${
                      service.highlight ? 'text-navy-900' : 'text-white'
                    }`}
                  >
                    {service.title}
                  </h3>
                </div>
              </div>
              <div className="px-6 pb-6">
                <p
                  className={`mb-6 leading-relaxed text-lg ${
                    service.highlight ? 'text-navy-800' : 'text-gray-300'
                  }`}
                >
                  {service.description}
                </p>

                {service.highlight ? (
                  <Link
                    href="/login"
                    className="bg-navy-900 hover:bg-navy-950 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 w-full justify-center transition-colors"
                  >
                    Acessar Portal
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="text-amber-400 font-semibold hover:text-amber-300 transition-colors flex items-center gap-2"
                  >
                    Saiba mais
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
