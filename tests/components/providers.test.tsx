import { render, screen } from '@testing-library/react'
import { Providers } from '@/components/providers'

// Mock the external dependencies
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({
    // Mock QueryClient methods if needed
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="query-provider">{children}</div>,
}))

jest.mock('@supabase/auth-helpers-react', () => ({
  SessionContextProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="session-provider">{children}</div>,
}))

describe('Providers Component', () => {
  it('should render children within providers', () => {
    render(
      <Providers>
        <div data-testid="test-child">Test Content</div>
      </Providers>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should wrap children with QueryClientProvider', () => {
    render(
      <Providers>
        <div data-testid="test-child">Test Content</div>
      </Providers>
    )

    expect(screen.getByTestId('query-provider')).toBeInTheDocument()
  })

  it('should wrap children with SessionContextProvider', () => {
    render(
      <Providers>
        <div data-testid="test-child">Test Content</div>
      </Providers>
    )

    expect(screen.getByTestId('session-provider')).toBeInTheDocument()
  })

  it('should render multiple children correctly', () => {
    render(
      <Providers>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </Providers>
    )

    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('should handle empty children', () => {
    render(<Providers>{null}</Providers>)

    expect(screen.getByTestId('query-provider')).toBeInTheDocument()
    expect(screen.getByTestId('session-provider')).toBeInTheDocument()
  })
})
