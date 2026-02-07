import type { Metadata } from 'next'
import SaasHeader from '@/components/saas/saas-header'
import SaasHero from '@/components/saas/saas-hero'
import SaasFeatures from '@/components/saas/saas-features'
import SaasMetrics from '@/components/saas/saas-metrics'
import SaasPreview from '@/components/saas/saas-preview'
import SaasPricing from '@/components/saas/saas-pricing'
import SaasCta from '@/components/saas/saas-cta'
import SaasFooter from '@/components/saas/saas-footer'

export const metadata: Metadata = {
  title: 'Prima Facie — Gestao Juridica Moderna',
  description: 'Plataforma completa de gestao para escritorios de advocacia. Processos, clientes, faturamento, documentos e muito mais.',
}

export default function SaasPage() {
  return (
    <main className="bg-saas-bg min-h-screen">
      <SaasHeader />
      <SaasHero />
      <SaasFeatures />
      <SaasMetrics />
      <SaasPreview />
      <SaasPricing />
      <SaasCta />
      <SaasFooter />
    </main>
  )
}
