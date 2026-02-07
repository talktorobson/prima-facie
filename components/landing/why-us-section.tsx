import { Award, Users, TrendingUp, Shield, Clock, Lightbulb } from 'lucide-react'

const reasons = [
  {
    icon: Award,
    title: 'Expertise Reconhecida',
    description: 'Mais de 20 anos de experiência em direito empresarial e trabalhista. Referência no mercado de proteção patrimonial.',
  },
  {
    icon: Users,
    title: 'Time Especializado',
    description: 'Advogados com formação contínua em direito preventivo e estratégico. Conhecimento profundo das legislações.',
  },
  {
    icon: TrendingUp,
    title: 'Resultados Comprovados',
    description: '200+ empresas protegidas e 2.500 processos gerenciados com sucesso. Taxa de satisfação superior a 95%.',
  },
  {
    icon: Shield,
    title: 'Proteção Abrangente',
    description: 'Consultoria preventiva, defesa estratégica e compliance. Cobertura completa para sua segurança jurídica.',
  },
  {
    icon: Clock,
    title: 'Disponibilidade Total',
    description: 'Portal 24/7 com acompanhamento em tempo real. Suporte responsivo e atendimento prioritário para clientes.',
  },
  {
    icon: Lightbulb,
    title: 'Soluções Inovadoras',
    description: 'Abordagens criativas e baseadas em melhor prática. Tecnologia integrada para eficiência máxima.',
  },
]

export default function WhyUsSection() {
  return (
    <section id="sobre" className="py-20 bg-white border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-navy-950 mb-6">
            Por Que Escolher D'Avila Reis
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Confiança, experiência e resultados comprovados ao proteger seu patrimônio e seu negócio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-blue-100 text-blue-600 mb-5 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <reason.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{reason.title}</h3>
              <p className="text-gray-600 leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <span className="text-2xl font-bold text-blue-600">20</span>
              </div>
              <p className="text-gray-600 font-medium">Anos</p>
              <p className="text-sm text-gray-500">de mercado</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <span className="text-2xl font-bold text-blue-600">200+</span>
              </div>
              <p className="text-gray-600 font-medium">Clientes</p>
              <p className="text-sm text-gray-500">protegidos</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <span className="text-2xl font-bold text-blue-600">2.5K+</span>
              </div>
              <p className="text-gray-600 font-medium">Processos</p>
              <p className="text-sm text-gray-500">gerenciados</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <span className="text-2xl font-bold text-blue-600">95%</span>
              </div>
              <p className="text-gray-600 font-medium">Satisfação</p>
              <p className="text-sm text-gray-500">de clientes</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
