import Link from 'next/link'
import { Phone, Mail, MapPin, Scale, Linkedin, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Scale className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">D'Avila Reis</h3>
                  <p className="text-xs text-gray-400">Advogados</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4 max-w-xs">
                Protegendo empresários há mais de 20 anos através de estratégias jurídicas preventivas, defesa especializada e conformidade legal.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Serviços */}
            <div>
              <h4 className="font-semibold text-white mb-4">Serviços</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#servicos" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Consultoria Preventiva
                  </Link>
                </li>
                <li>
                  <Link href="#servicos" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Defesa Estratégica
                  </Link>
                </li>
                <li>
                  <Link href="#servicos" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Compliance Trabalhista
                  </Link>
                </li>
                <li>
                  <Link href="#servicos" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Blindagem Patrimonial
                  </Link>
                </li>
              </ul>
            </div>

            {/* Empresa */}
            <div>
              <h4 className="font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#sobre" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="#equipe" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Nossa Equipe
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Blog Jurídico
                  </Link>
                </li>
                <li>
                  <Link href="#contato" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Contato
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    Aviso Legal
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                    LGPD
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-gray-800">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-white text-sm">Telefone</p>
                <a href="tel:+551533844013" className="text-gray-400 hover:text-blue-400 transition-colors">
                  (15) 3384-4013
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-white text-sm">E-mail</p>
                <a href="mailto:financeiro@davilareisadvogados.com.br" className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                  financeiro@davilareisadvogados.com.br
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-white text-sm">Endereço</p>
                <p className="text-gray-400 text-sm">
                  Av. Dr. Vinício Gagliardi, 675<br />
                  Cerquilho/SP - CEP: 18520-091
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>
              © 2024 D'Avila Reis Advogados. Todos os direitos reservados.
            </p>
            <p>
              CNPJ: XX.XXX.XXX/0001-XX | OAB/SP: XXXXX
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
