import { metadata } from '@/app/layout'

describe('metadata', () => {
  it('should have correct title', () => {
    expect(metadata.title).toBe('D\'Avila Reis Advogados — Advocacia Empresarial e Trabalhista')
  })

  it('should have correct description', () => {
    expect(metadata.description).toBe('Escritório especializado em direito empresarial e trabalhista preventivo. Mais de 20 anos protegendo empresários e blindando patrimônios.')
  })
})
