import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Carlos Mendes',
    company: 'Manufatura Industrial Mendes',
    role: 'CEO',
    content:
      'A consultoria preventiva da D\'Avila Reis nos poupou centenas de milhares de reais. Excelente atendimento e resultados reais.',
    rating: 5,
  },
  {
    name: 'Fernanda Silva',
    company: 'Tech Solutions Brasil',
    role: 'Diretora Jurídica',
    content:
      'Implementamos o sistema de compliance recomendado. Agora tenho total tranquilidade sobre nossa conformidade legal.',
    rating: 5,
  },
  {
    name: 'Roberto Oliveira',
    company: 'Logística Integrada RO',
    role: 'Sócio-Gerente',
    content:
      'Defenderam-nos em um processo trabalhista complexo. Foram brilhantes na estratégia e resultado superou expectativas.',
    rating: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-navy-950 mb-6">
            Histórias de Sucesso
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Empresas que confiaram em nossa expertise e protegeram seus negócios
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-8 rounded-xl bg-gradient-to-br from-blue-50 to-gray-50 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-blue-400 text-blue-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="pt-6 border-t border-gray-200">
                <p className="font-semibold text-gray-900">{testimonial.name}</p>
                <p className="text-sm text-blue-600 font-medium">{testimonial.role}</p>
                <p className="text-sm text-gray-600">{testimonial.company}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Stats */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">95%</div>
                <p className="text-gray-600 font-medium">Taxa de Satisfação dos Clientes</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
                <p className="text-gray-600 font-medium">Taxa de Retenção de Clientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
