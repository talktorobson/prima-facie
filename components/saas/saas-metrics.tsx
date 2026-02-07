import ScrollReveal from '@/components/landing/scroll-reveal'

const stats = [
  { number: '50+', label: 'Tabelas no banco' },
  { number: '57', label: 'Telas na plataforma' },
  { number: '12', label: 'Modulos integrados' },
  { number: '62', label: 'Suites de teste' },
]

export default function SaasMetrics() {
  return (
    <section className="bg-saas-surface border-y border-saas-border py-20">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mb-12">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl md:text-5xl font-mono font-bold text-saas-heading mb-2">
                  {stat.number}
                </p>
                <p className="text-sm text-saas-muted">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-mono text-saas-muted">
            Next.js 14 &middot; Supabase &middot; TypeScript &middot; TanStack Query
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
