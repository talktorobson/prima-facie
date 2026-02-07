import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

// Mock landing page components
jest.mock('@/components/landing/hero', () => () => <div data-testid="hero">Hero</div>)
jest.mock('@/components/landing/credentials', () => () => <div data-testid="credentials">Credentials</div>)
jest.mock('@/components/landing/practice-areas', () => () => <div data-testid="practice-areas">Practice Areas</div>)
jest.mock('@/components/landing/philosophy', () => () => <div data-testid="philosophy">Philosophy</div>)
jest.mock('@/components/landing/methodology', () => () => <div data-testid="methodology">Methodology</div>)
jest.mock('@/components/landing/content-preview', () => () => <div data-testid="content-preview">Content Preview</div>)
jest.mock('@/components/landing/coverage-region', () => () => <div data-testid="coverage-region">Coverage Region</div>)
jest.mock('@/components/landing/founders', () => () => <div data-testid="founders">Founders</div>)
jest.mock('@/components/landing/cta-final', () => () => <div data-testid="cta-final">CTA Final</div>)
jest.mock('@/components/landing/footer', () => () => <div data-testid="footer">Footer</div>)

describe('HomePage', () => {
  it('should render the landing page sections', () => {
    render(<HomePage />)

    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('credentials')).toBeInTheDocument()
    expect(screen.getByTestId('practice-areas')).toBeInTheDocument()
    expect(screen.getByTestId('philosophy')).toBeInTheDocument()
    expect(screen.getByTestId('methodology')).toBeInTheDocument()
    expect(screen.getByTestId('content-preview')).toBeInTheDocument()
    expect(screen.getByTestId('coverage-region')).toBeInTheDocument()
    expect(screen.getByTestId('founders')).toBeInTheDocument()
    expect(screen.getByTestId('cta-final')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('should render within a main element', () => {
    const { container } = render(<HomePage />)
    expect(container.querySelector('main')).toBeInTheDocument()
  })
})
