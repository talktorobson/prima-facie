import type { Metadata } from 'next'
import { Inter, Cormorant_Garamond, Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-serif',
})
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'D\'Avila Reis Advogados — Advocacia Empresarial e Trabalhista',
  description: 'Escritório especializado em direito empresarial e trabalhista preventivo. Mais de 20 anos protegendo empresários e blindando patrimônios.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${cormorant.variable} ${outfit.variable} font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
