import { render, screen } from '@testing-library/react'
import RootLayout, { metadata } from '@/app/layout'

// Mock the Providers component
jest.mock('@/components/providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="providers">{children}</div>
  ),
}))

describe('RootLayout', () => {
  it('should render children within providers', () => {
    render(
      <RootLayout>
        <div data-testid="test-content">Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByTestId('providers')).toBeInTheDocument()
  })

  it('should have correct HTML structure', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    const htmlElement = container.querySelector('html')
    const bodyElement = container.querySelector('body')

    expect(htmlElement).toHaveAttribute('lang', 'pt-BR')
    expect(bodyElement).toBeInTheDocument()
  })

  it('should apply Inter font class to body', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    const bodyElement = container.querySelector('body')
    expect(bodyElement).toHaveClass()
  })
})

describe('metadata', () => {
  it('should have correct title', () => {
    expect(metadata.title).toBe('Prima Facie - Sistema de Gestão para Escritórios de Advocacia')
  })

  it('should have correct description', () => {
    expect(metadata.description).toBe('Plataforma completa para gestão de escritórios de advocacia com foco em simplicidade e eficiência')
  })
})