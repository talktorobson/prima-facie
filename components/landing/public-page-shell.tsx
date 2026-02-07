import Header from '@/components/landing/header'
import Footer from '@/components/landing/footer'

export default function PublicPageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header variant="solid" />
      {children}
      <Footer />
    </>
  )
}
