import { render, screen } from '@testing-library/react'
import HomePage from '@/app/page'

// Mock landing page components
jest.mock('@/components/landing/hero', () => () => <div data-testid="hero">Hero</div>)
jest.mock('@/components/landing/credentials', () => () => <div data-testid="credentials">Credentials</div>)
jest.mock('@/components/landing/practice-areas', () => () => <div data-testid="practice-areas">Practice Areas</div>)
jest.mock('@/components/landing/philosophy', () => () => <div data-testid="philosophy">Philosophy</div>)
jest.mock('@/components/landing/founders', () => () => <div data-testid="founders">Founders</div>)
jest.mock('@/components/landing/contact', () => () => <div data-testid="contact">Contact</div>)
jest.mock('@/components/landing/footer', () => () => <div data-testid="footer">Footer</div>)

describe('HomePage', () => {
  it('should render the landing page sections', () => {
    render(<HomePage />)

    expect(screen.getByTestId('hero')).toBeInTheDocument()
    expect(screen.getByTestId('credentials')).toBeInTheDocument()
    expect(screen.getByTestId('practice-areas')).toBeInTheDocument()
    expect(screen.getByTestId('philosophy')).toBeInTheDocument()
    expect(screen.getByTestId('founders')).toBeInTheDocument()
    expect(screen.getByTestId('contact')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
  })

  it('should render within a main element', () => {
    const { container } = render(<HomePage />)
    expect(container.querySelector('main')).toBeInTheDocument()
  })
})
