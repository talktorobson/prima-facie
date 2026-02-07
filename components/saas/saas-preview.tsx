import ScrollReveal from '@/components/landing/scroll-reveal'

export default function SaasPreview() {
  return (
    <section id="plataforma" className="bg-saas-bg py-24 overflow-hidden">
      <div className="container mx-auto px-6">
        <ScrollReveal className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-saas-heading mb-4">
            Interface moderna e intuitiva
          </h2>
          <p className="text-saas-muted text-lg max-w-2xl mx-auto">
            Projetada para produtividade no dia a dia do escritorio.
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <div
            className="max-w-4xl mx-auto rounded-xl overflow-hidden border border-saas-border shadow-2xl"
            style={{
              transform: 'perspective(1200px) rotateX(2deg)',
              boxShadow: '0 40px 80px rgba(124, 58, 237, 0.1), 0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Browser chrome */}
            <div className="bg-saas-surface border-b border-saas-border px-4 py-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="flex-1 ml-4">
                <div className="bg-saas-bg rounded-md px-3 py-1.5 max-w-xs">
                  <span className="text-xs text-saas-muted font-mono">app.primafacie.com.br</span>
                </div>
              </div>
            </div>

            {/* Dashboard skeleton */}
            <div className="bg-saas-bg flex min-h-[320px]">
              {/* Sidebar */}
              <div className="w-48 bg-saas-surface border-r border-saas-border p-4 hidden sm:block">
                <div className="h-6 w-24 bg-saas-border rounded mb-6" />
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-4 rounded mb-3 ${
                      i === 0 ? 'w-28 bg-saas-violet/30' : 'w-20 bg-saas-border/50'
                    }`}
                  />
                ))}
              </div>

              {/* Content area */}
              <div className="flex-1 p-6">
                <div className="h-6 w-40 bg-saas-border rounded mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-saas-surface rounded-lg border border-saas-border p-4"
                    >
                      <div className="h-3 w-16 bg-saas-border/50 rounded mb-3" />
                      <div className="h-8 w-12 bg-saas-violet/20 rounded mb-2" />
                      <div className="h-2 w-20 bg-saas-border/30 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
