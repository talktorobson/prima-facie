import Link from 'next/link'

export default function SaasFooter() {
  return (
    <footer className="bg-saas-surface border-t border-saas-border">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-lg font-display font-bold text-saas-heading mb-2">Prima Facie</p>
            <p className="text-sm text-saas-muted leading-relaxed max-w-xs">
              Plataforma de gestao juridica moderna para escritorios de advocacia brasileiros.
            </p>
          </div>

          {/* Page links */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-saas-muted mb-4">Navegacao</h4>
            <ul className="space-y-2">
              {[
                { href: '#funcionalidades', label: 'Funcionalidades' },
                { href: '#plataforma', label: 'Plataforma' },
                { href: '#precos', label: 'Precos' },
                { href: '/register', label: 'Criar Conta' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-saas-muted hover:text-saas-text transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-saas-muted mb-4">Legal</h4>
            <ul className="space-y-2">
              {[
                { href: '/terms', label: 'Termos de Uso' },
                { href: '/privacy', label: 'Politica de Privacidade' },
                { href: '/contact', label: 'Contato' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-saas-muted hover:text-saas-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-saas-border mt-8 pt-8 text-center">
          <p className="text-xs text-saas-muted">
            &copy; 2026 Prima Facie. Feito no Brasil.
          </p>
        </div>
      </div>
    </footer>
  )
}
