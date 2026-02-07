import { Phone, Mail, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-white py-10 border-t border-navy-900">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">DR</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">D&apos;avila Reis</h3>
                <p className="text-sm text-gray-400">Advogados</p>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed mb-4 max-w-md text-sm">
              Protegendo empresários há mais de 20 anos através de estratégias jurídicas preventivas
              e defesa especializada.
            </p>
          </div>

          {/* Serviços */}
          <div>
            <h4 className="text-base font-semibold mb-3 text-gray-300">Serviços</h4>
            <ul className="space-y-2 text-gray-400 text-xs">
              <li>
                <span className="hover:text-amber-500 transition-colors cursor-pointer">
                  Consultoria Preventiva
                </span>
              </li>
              <li>
                <span className="hover:text-amber-500 transition-colors cursor-pointer">
                  Defesa Trabalhista
                </span>
              </li>
              <li>
                <span className="hover:text-amber-500 transition-colors cursor-pointer">
                  Compliance Empresarial
                </span>
              </li>
              <li>
                <span className="hover:text-amber-500 transition-colors cursor-pointer">
                  Portal do Cliente
                </span>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="text-base font-semibold mb-3 text-gray-300">Recursos</h4>
            <ul className="space-y-2 text-gray-400 text-xs">
              <li>
                <span className="hover:text-amber-500 transition-colors cursor-pointer">
                  Blog Jurídico
                </span>
              </li>
              <li>
                <span className="hover:text-amber-500 transition-colors cursor-pointer">
                  Casos de Sucesso
                </span>
              </li>
              <li>
                <span className="hover:text-amber-500 transition-colors cursor-pointer">
                  Guias Gratuitos
                </span>
              </li>
              <li>
                <span className="hover:text-amber-500 transition-colors cursor-pointer">
                  Trabalhe Conosco
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Contato Footer */}
        <div className="border-t border-navy-800 mt-8 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <p className="text-gray-400 text-xs">Telefone: (15) 3384-4013</p>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <p className="text-gray-400 text-xs">
                Email: financeiro@davilareisadvogados.com.br
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <p className="text-gray-400 text-xs">
                Av. Dr. Vinício Gagliardi, 675, Centro, Cerquilho/SP
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-navy-800 pt-4">
          <p className="text-gray-400 text-xs text-center">
            © 2024 D&apos;avila Reis Advogados. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
