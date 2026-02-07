import Hero from '@/components/landing/hero'
import RiskSection from '@/components/landing/risk-section'
import Services from '@/components/landing/services'
import Team from '@/components/landing/team'
import Contact from '@/components/landing/contact'
import Footer from '@/components/landing/footer'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <RiskSection />
      <Services />
      <Team />
      <Contact />
      <Footer />
    </main>
  )
}
