import Link from 'next/link'
import { Shield, Scale, FileText, ArrowRight } from 'lucide-react'

const services = [
  {
    icon: Shield,
    title: 'Consultoria Preventiva',
    description:
      'Auditoria completa dos seus processos, criação de políticas internas e treinamento de equipes. Identifique riscos antes que se tornem problemas.',
    benefit: 'Redução de litígios em até 80%',
  },
  {
    icon: Scale,
    title: 'Defesa Estratégica',
    description:
      'Representação especializada em processos trabalhistas e empresariais. Estratégias focadas na proteção do seu patrimônio pessoal e empresarial.',
    benefit: 'Resultados comprovados em 2.500+ casos',
  },
  {
    icon: FileText,
    title: 'Compliance Trabalhista',
    description:
      'Implementação de sistemas de conformidade com legislação vigente. Documentação completa e políticas que protegem sua empresa.',
    benefit: 'Conformidade total com CLT e normas regulatórias',
  },
  {
    icon: Shield,
    title: 'Blindagem Patrimonial',
    description:
      'Estruturação jurídica para proteger bens pessoais e empresariais. Análise de riscos e implementação de proteções efetivas.',
    benefit: 'Proteção abrangente do seu patrimônio',
  },
]

export default function Services() {
  return (
    <section id="servicos" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-navy-950 mb-6">
            Nossos Serviços
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Soluções jurídicas completas para proteger seu negócio em todas as frentes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {services.map((service, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-blue-100 text-blue-600 mb-5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-600 leading-relaxed mb-6">{service.description}</p>
              <div className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold mb-4">
                {service.benefit}
              </div>
              <div className="pt-4 border-t border-gray-200">
                <button
                  type="button"
                  className="text-blue-600 font-semibold hover:text-blue-700 transition-colors flex items-center gap-2 group/btn"
                >
                  Saiba mais
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <p className="text-lg text-gray-600 mb-6">
            Quer entender melhor qual solução se adequa ao seu negócio?
          </p>
          <Link
            href="#contato"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
          >
            Agende uma Consultoria
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  )
}
