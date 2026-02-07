import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/(auth)/login/page'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSignIn = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/lib/providers/auth-provider', () => ({
  useAuthContext: () => ({
    signIn: mockSignIn,
    error: null,
  }),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('LoginPage', () => {
  it('should render login form elements', () => {
    render(<LoginPage />)

    expect(screen.getByText('Acesse sua conta')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByText('crie uma nova conta')).toBeInTheDocument()
    expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument()
  })

  it('should update email and password inputs', async () => {
    const user = userEvent.setup()
    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Senha')

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('should handle successful login', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: null })

    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123')
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should handle login error', async () => {
    const user = userEvent.setup()
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })

    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    // When signIn returns an error, push should not be called
    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    mockSignIn.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
    )

    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Entrando...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Entrar')).toBeInTheDocument()
    })
  })

  it('should require email and password fields', () => {
    render(<LoginPage />)

    expect(screen.getByPlaceholderText('Email')).toBeRequired()
    expect(screen.getByPlaceholderText('Senha')).toBeRequired()
  })

  it('should have correct links', () => {
    render(<LoginPage />)

    const registerLink = screen.getByText('crie uma nova conta')
    const forgotPasswordLink = screen.getByText('Esqueceu sua senha?')

    expect(registerLink.closest('a')).toHaveAttribute('href', '/register')
    expect(forgotPasswordLink.closest('a')).toHaveAttribute('href', '/forgot-password')
  })

  it('should handle network errors gracefully', async () => {
    const user = userEvent.setup()
    mockSignIn.mockRejectedValue(new Error('Network error'))

    render(<LoginPage />)

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Senha'), 'password123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      expect(screen.getByText('Ocorreu um erro ao fazer login')).toBeInTheDocument()
    })
  })
})
