import Hero from '@/components/landing/hero'
import Credentials from '@/components/landing/credentials'
import PracticeAreas from '@/components/landing/practice-areas'
import Philosophy from '@/components/landing/philosophy'
import Contact from '@/components/landing/contact'
import Footer from '@/components/landing/footer'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Credentials />
      <PracticeAreas />
      <Philosophy />
      <Contact />
      <Footer />
    </main>
  )
}
