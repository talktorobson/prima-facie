'use client'

import Link from 'next/link'
import ScrollReveal from '@/components/landing/scroll-reveal'
import { useState } from 'react'

const articles = [
  {
    title: '5 erros que aumentam o passivo trabalhista da sua empresa',
    excerpt:
      'Conhea as falhas mais comuns na gestao de pessoal que geram reclamacoes trabalhistas — e como corrigi-las antes que virem processo.',
    category: 'Trabalhista',
  },
  {
    title: 'Clausulas essenciais em contratos de prestacao de servicos',
    excerpt:
      'Um contrato mal redigido pode custar caro. Veja quais clausulas protegem sua empresa em disputas comerciais.',
    category: 'Contratos',
  },
  {
    title: 'Como funciona a cobranca judicial de duplicatas',
    excerpt:
      'Entenda o passo a passo da execucao de titulos e quando vale a pena acionar o judiciario para recuperar creditos.',
    category: 'Cobranca',
  },
]

export default function ContentPreview() {
  const [email, setEmail] = useState('')

  return (
    <section className="py-24 bg-landing-charcoal">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white gold-line mx-auto inline-block">
              Alertas e guias praticos para empresas
            </h2>
          </div>
        </ScrollReveal>

        {/* Article cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {articles.map((article, index) => (
            <ScrollReveal key={article.title} delay={`${index * 100}ms`}>
              <div className="border border-white/10 p-8 hover:-translate-y-1 transition-transform group h-full flex flex-col">
                <span className="inline-block text-xs uppercase tracking-[0.15em] text-landing-gold font-medium mb-4">
                  {article.category}
                </span>
                <h3 className="text-lg font-serif font-semibold text-white mb-3 leading-snug">
                  {article.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm flex-1">
                  {article.excerpt}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Newsletter */}
        <ScrollReveal delay="300ms">
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-xl font-serif font-semibold text-white mb-4">
              Receba alertas juridicos no seu e-mail
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-landing-gold transition-colors"
              />
              <button
                type="button"
                className="px-6 py-3 bg-landing-gold text-white font-medium text-sm tracking-wide hover:bg-landing-gold-light transition-colors whitespace-nowrap"
              >
                Receber alertas
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Ao se inscrever, voce concorda com nossa Politica de Privacidade.
              Voce pode cancelar a qualquer momento.
            </p>
          </div>
        </ScrollReveal>

        {/* CTA */}
        <ScrollReveal delay="450ms">
          <div className="text-center mt-14">
            <Link
              href="/conteudos"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white font-medium text-base tracking-wide hover:bg-white/10 transition-colors"
            >
              Ver todos os conteudos
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
