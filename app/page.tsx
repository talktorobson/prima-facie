import Header from '@/components/landing/header'
import Hero from '@/components/landing/hero'
import WhyUsSection from '@/components/landing/why-us-section'
import Services from '@/components/landing/services'
import Testimonials from '@/components/landing/testimonials'
import Team from '@/components/landing/team'
import Contact from '@/components/landing/contact'
import Footer from '@/components/landing/footer'

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <WhyUsSection />
      <Services />
      <Testimonials />
      <Team />
      <Contact />
      <Footer />
    </main>
  )
}
