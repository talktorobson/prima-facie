import { AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'

const stats = [
  {
    icon: TrendingUp,
    number: '3M+',
    label: 'Processos Trabalhistas',
    description: 'São abertos anualmente no Brasil segundo o TST',
  },
  {
    icon: AlertTriangle,
    number: '99%',
    label: 'Patrimônio em Risco',
    description: 'Casos de inadimplência empresarial atingem bens pessoais dos sócios',
  },
  {
    icon: DollarSign,
    number: 'R$ 500k+',
    label: 'Valor Médio',
    description: 'Das condenações trabalhistas em empresas de médio porte',
  },
]

export default function RiskSection() {
  return (
    <section className="py-20 bg-navy-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-red-900/20 text-red-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-red-800/30">
            <AlertTriangle className="h-4 w-4" />
            Alerta Importante
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            99% dos Empresários Não Sabem:
          </h2>
          <p className="text-2xl text-red-400 font-semibold max-w-3xl mx-auto">
            Processos Trabalhistas Podem Atingir Seu Patrimônio Pessoal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center shadow-lg hover:shadow-xl transition-all duration-300 bg-navy-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-navy-700/30 p-8"
            >
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-800/30">
                <stat.icon className="h-8 w-8 text-red-400" />
              </div>
              <div className="text-5xl font-bold text-white mb-4">{stat.number}</div>
              <h3 className="text-xl font-bold text-red-400 mb-3">{stat.label}</h3>
              <p className="text-gray-300 leading-relaxed">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
