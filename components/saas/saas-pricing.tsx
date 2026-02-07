import Link from 'next/link'
import { Check } from 'lucide-react'
import ScrollReveal from '@/components/landing/scroll-reveal'

const plans = [
  {
    name: 'Basico',
    price: 'R$ 197',
    period: '/mes',
    description: 'Para escritorios individuais',
    features: [
      'Ate 5 usuarios',
      'Ate 50 processos',
      '5 GB de armazenamento',
      'Portal do cliente',
      'Suporte por email',
    ],
    highlight: false,
  },
  {
    name: 'Profissional',
    price: 'R$ 497',
    period: '/mes',
    description: 'Para escritorios em crescimento',
    features: [
      'Ate 20 usuarios',
      'Ate 500 processos',
      '50 GB de armazenamento',
      'Portal do cliente',
      'Pipeline de vendas',
      'Relatorios avancados',
      'Suporte prioritario',
    ],
    highlight: true,
  },
  {
    name: 'Empresarial',
    price: 'R$ 997',
    period: '/mes',
    description: 'Para grandes escritorios',
    features: [
      'Ate 100 usuarios',
      'Ate 5.000 processos',
      '500 GB de armazenamento',
      'Portal do cliente',
      'Pipeline de vendas',
      'Relatorios avancados',
      'API de integracao',
      'Suporte dedicado',
      'SLA garantido',
    ],
    highlight: false,
  },
]

export default function SaasPricing() {
  return (
    <section id="precos" className="bg-saas-bg py-24">
      <div className="container mx-auto px-6">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-saas-heading mb-4">
            Planos simples e transparentes
          </h2>
          <p className="text-saas-muted text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para seu escritorio. Todos incluem 14 dias de teste gratuito.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <ScrollReveal key={plan.name} delay={`${index * 100}ms`}>
              <div
                className={`saas-glass rounded-xl p-8 h-full flex flex-col relative ${
                  plan.highlight ? 'border-saas-violet ring-1 ring-saas-violet/50' : ''
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-medium bg-gradient-to-r from-saas-violet to-saas-cyan text-white rounded-full">
                    Mais Popular
                  </span>
                )}

                <h3 className="text-xl font-display font-semibold text-saas-heading mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-saas-muted mb-6">{plan.description}</p>

                <div className="mb-8">
                  <span className="text-4xl font-display font-bold text-saas-heading">
                    {plan.price}
                  </span>
                  <span className="text-sm text-saas-muted">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-saas-text">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-saas-cyan" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block text-center py-3 rounded-lg text-sm font-medium transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-saas-violet to-saas-cyan text-white hover:opacity-90'
                      : 'border border-saas-border text-saas-text hover:bg-saas-surface hover:border-saas-muted'
                  }`}
                >
                  Comecar Teste Gratuito
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
