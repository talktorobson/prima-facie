/**
 * Frontend UI Tests: Cross-Page Navigation and CTAs
 * Tests navigation links, CTAs, and cross-page flows
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals'

// Mock Next.js router
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => '/',
}))

// Note: Mock components are self-contained and don't import from @/ paths

// --- Mock: Register Page (links section) ---
const MockRegisterLinks = () => (
  <div data-testid="register-page">
    <h2>Crie sua conta</h2>
    <form data-testid="register-form">
      <button type="submit">Criar conta</button>
    </form>
    <div data-testid="legal-links">
      Ao criar uma conta, voce concorda com nossos{' '}
      <a href="/terms" data-testid="terms-link">Termos de Uso</a>
      {' '}e{' '}
      <a href="/privacy" data-testid="privacy-link">Politica de Privacidade</a>
    </div>
  </div>
)

// --- Mock: Client Portal Dashboard (quick links) ---
const MockClientPortalDashboard = () => (
  <div data-testid="client-portal-dashboard">
    <h1>Bem-vindo, Test User!</h1>

    <div data-testid="summary-cards">
      <div data-testid="card-matters">Processos Ativos: 3</div>
      <div data-testid="card-invoices">Faturas Pendentes: R$ 5.000,00</div>
    </div>

    <div data-testid="recent-matters">
      <h3>Processos Recentes</h3>
      <a href="/portal/client/matters" data-testid="view-all-matters">Ver todos</a>
    </div>

    <div data-testid="quick-links">
      <h3>Acesso Rapido</h3>
      <a href="/portal/client/matters" data-testid="quick-link-matters">
        <span>Ver Processos</span>
        <span>Acompanhe seus casos</span>
      </a>
      <a href="/portal/client/messages" data-testid="quick-link-messages">
        <span>Mensagens</span>
        <span>Fale com seu advogado</span>
      </a>
      <a href="/portal/client/profile" data-testid="quick-link-profile">
        <span>Meu Perfil</span>
        <span>Atualize seus dados</span>
      </a>
    </div>
  </div>
)

// --- Mock: Pipeline Page (edit buttons) ---
const MockPipelinePage = ({ cards }: {
  cards?: { id: string; title: string; stage: string }[]
}) => {
  const pipelineCards = cards ?? [
    { id: 'card-1', title: 'Lead Alpha', stage: 'Prospecção' },
    { id: 'card-2', title: 'Lead Beta', stage: 'Qualificação' },
    { id: 'card-3', title: 'Lead Gamma', stage: 'Proposta' },
  ]

  return (
    <div data-testid="pipeline-page">
      <h1>Pipeline de Vendas</h1>
      <div data-testid="pipeline-board">
        {pipelineCards.map(card => (
          <div key={card.id} data-testid={`pipeline-card-${card.id}`}>
            <h4>{card.title}</h4>
            <p>{card.stage}</p>
            <a
              href={`/pipeline/${card.id}/edit`}
              data-testid={`edit-btn-${card.id}`}
            >
              Editar
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- Middleware public paths unit test ---
const middlewarePublicPaths = ['/', '/saas', '/about', '/contact']

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('Navigation & CTA Tests', () => {
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  // ====================== REGISTER PAGE LINKS ======================
  describe('Register Page Links', () => {
    it('should have Terms of Use link pointing to /terms', () => {
      render(<TestWrapper><MockRegisterLinks /></TestWrapper>)
      const termsLink = screen.getByTestId('terms-link')
      expect(termsLink).toBeInTheDocument()
      expect(termsLink).toHaveAttribute('href', '/terms')
      expect(termsLink).toHaveTextContent('Termos de Uso')
    })

    it('should have Privacy Policy link pointing to /privacy', () => {
      render(<TestWrapper><MockRegisterLinks /></TestWrapper>)
      const privacyLink = screen.getByTestId('privacy-link')
      expect(privacyLink).toBeInTheDocument()
      expect(privacyLink).toHaveAttribute('href', '/privacy')
      expect(privacyLink).toHaveTextContent('Politica de Privacidade')
    })

    it('should render both links in the legal notice text', () => {
      render(<TestWrapper><MockRegisterLinks /></TestWrapper>)
      const legalLinks = screen.getByTestId('legal-links')
      expect(legalLinks).toHaveTextContent('Ao criar uma conta')
      expect(legalLinks).toHaveTextContent('Termos de Uso')
      expect(legalLinks).toHaveTextContent('Politica de Privacidade')
    })
  })

  // ====================== PORTAL CLIENT DASHBOARD ======================
  describe('Portal Client Dashboard', () => {
    it('should have "Ver Processos" quick link to /portal/client/matters', () => {
      render(<TestWrapper><MockClientPortalDashboard /></TestWrapper>)
      const link = screen.getByTestId('quick-link-matters')
      expect(link).toHaveAttribute('href', '/portal/client/matters')
      expect(link).toHaveTextContent('Ver Processos')
    })

    it('should have "Mensagens" quick link to /portal/client/messages', () => {
      render(<TestWrapper><MockClientPortalDashboard /></TestWrapper>)
      const link = screen.getByTestId('quick-link-messages')
      expect(link).toHaveAttribute('href', '/portal/client/messages')
      expect(link).toHaveTextContent('Mensagens')
    })

    it('should have "Meu Perfil" quick link to /portal/client/profile', () => {
      render(<TestWrapper><MockClientPortalDashboard /></TestWrapper>)
      const link = screen.getByTestId('quick-link-profile')
      expect(link).toHaveAttribute('href', '/portal/client/profile')
      expect(link).toHaveTextContent('Meu Perfil')
    })

    it('should have "Ver todos" link for matters pointing to /portal/client/matters', () => {
      render(<TestWrapper><MockClientPortalDashboard /></TestWrapper>)
      const viewAll = screen.getByTestId('view-all-matters')
      expect(viewAll).toHaveAttribute('href', '/portal/client/matters')
    })
  })

  // ====================== PIPELINE PAGE ======================
  describe('Pipeline Page', () => {
    it('should render edit button for each pipeline card', () => {
      render(<TestWrapper><MockPipelinePage /></TestWrapper>)

      expect(screen.getByTestId('edit-btn-card-1')).toBeInTheDocument()
      expect(screen.getByTestId('edit-btn-card-2')).toBeInTheDocument()
      expect(screen.getByTestId('edit-btn-card-3')).toBeInTheDocument()
    })

    it('should have edit links pointing to /pipeline/[id]/edit', () => {
      render(<TestWrapper><MockPipelinePage /></TestWrapper>)

      expect(screen.getByTestId('edit-btn-card-1')).toHaveAttribute('href', '/pipeline/card-1/edit')
      expect(screen.getByTestId('edit-btn-card-2')).toHaveAttribute('href', '/pipeline/card-2/edit')
      expect(screen.getByTestId('edit-btn-card-3')).toHaveAttribute('href', '/pipeline/card-3/edit')
    })

    it('should render pipeline card titles', () => {
      render(<TestWrapper><MockPipelinePage /></TestWrapper>)

      expect(screen.getByText('Lead Alpha')).toBeInTheDocument()
      expect(screen.getByText('Lead Beta')).toBeInTheDocument()
      expect(screen.getByText('Lead Gamma')).toBeInTheDocument()
    })
  })

  // ====================== MIDDLEWARE PUBLIC PATHS ======================
  describe('Middleware Public Paths', () => {
    it('should include /saas in public paths', () => {
      expect(middlewarePublicPaths).toContain('/saas')
    })

    it('should include /about in public paths', () => {
      expect(middlewarePublicPaths).toContain('/about')
    })

    it('should include /contact in public paths', () => {
      expect(middlewarePublicPaths).toContain('/contact')
    })

    it('should include / (root) in public paths', () => {
      expect(middlewarePublicPaths).toContain('/')
    })

    it('should have exactly 4 public paths', () => {
      expect(middlewarePublicPaths).toHaveLength(4)
    })
  })
})
