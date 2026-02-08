import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-landing-ink text-white">
      {/* Gold separator */}
      <div className="h-[1px] bg-landing-gold/30" />

      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
          {/* Firm name + tagline */}
          <div>
            <h3 className="text-2xl font-serif font-bold mb-3">D&apos;Avila Reis</h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Advocacia empresarial e trabalhista preventiva.
              Protegendo empresários há mais de 20 anos.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-5">
              Navegação
            </h4>
            <ul className="space-y-3">
              {[
                { href: '/sobre', label: 'Sobre o Escritório' },
                { href: '/atuacao', label: 'Áreas de Atuação' },
                { href: '/conteudos', label: 'Conteúdos' },
                { href: '/contato', label: 'Contato' },
                { href: '/login', label: 'Portal do Cliente' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-5">
              Contato
            </h4>
            <div className="space-y-3 text-sm text-gray-400">
              <p>(15) 3384-4013</p>
              <p>recepcao@davilareisadvogados.com.br</p>
              <p>
                Av. Dr. Vinício Gagliardi, 675
                <br />
                Centro, Cerquilho/SP
              </p>
            </div>

          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; 2026 D&apos;Avila Reis Advogados. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <Link href="/politica-de-privacidade" className="hover:text-gray-300 transition-colors">
              Política de Privacidade
            </Link>
            <span>|</span>
            <Link href="/cookies" className="hover:text-gray-300 transition-colors">
              Cookies
            </Link>
            <span>|</span>
            <Link href="/aviso-legal" className="hover:text-gray-300 transition-colors">
              Aviso Legal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
