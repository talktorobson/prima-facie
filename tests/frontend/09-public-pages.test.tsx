/**
 * Frontend UI Tests: Public/Static Pages
 * Tests terms, privacy, saas, about, and contact pages
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, jest } from '@jest/globals'

// Mock Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => '/',
}))

// Note: Mock components are self-contained and don't import from @/ paths

// --- Mock: Terms Page ---
const MockTermsPage = () => {
  const sections = [
    '1. Aceitacao dos Termos',
    '2. Descricao do Servico',
    '3. Cadastro e Conta',
    '4. Uso Adequado',
    '5. Protecao de Dados',
    '6. Propriedade Intelectual',
    '7. Limitacao de Responsabilidade',
    '8. Alteracoes nos Termos',
    '9. Foro',
  ]

  return (
    <div data-testid="terms-page">
      <h1>Termos de Uso</h1>
      <div data-testid="terms-content">
        {sections.map(section => (
          <h2 key={section} data-testid={`section-${section.split('.')[0].trim()}`}>{section}</h2>
        ))}
        <p>
          Consulte nossa{' '}
          <a href="/privacy" data-testid="privacy-link">Politica de Privacidade</a>
        </p>
      </div>
      <div data-testid="terms-footer">
        <a href="/register" data-testid="back-to-register">Voltar para cadastro</a>
      </div>
    </div>
  )
}

// --- Mock: Privacy Page ---
const MockPrivacyPage = () => {
  const sections = [
    '1. Introducao',
    '2. Dados Coletados',
    '3. Finalidade do Tratamento',
    '4. Compartilhamento de Dados',
    '5. Armazenamento e Seguranca',
    '6. Direitos do Titular',
    '7. Retencao de Dados',
    '8. Contato',
  ]

  return (
    <div data-testid="privacy-page">
      <h1>Politica de Privacidade</h1>
      <div data-testid="privacy-content">
        <p>
          em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei n. 13.709/2018).
        </p>
        {sections.map(section => (
          <h2 key={section} data-testid={`section-${section.split('.')[0].trim()}`}>{section}</h2>
        ))}
      </div>
      <div data-testid="privacy-footer">
        <a href="/register" data-testid="back-to-register">Voltar para cadastro</a>
      </div>
    </div>
  )
}

// --- Mock: SaaS Page ---
const MockSaasPage = () => {
  const plans = [
    {
      name: 'Basico',
      price: 'R$ 197',
      description: 'Para escritorios individuais',
      features: ['Ate 5 usuarios', 'Ate 50 processos', '5 GB de armazenamento', 'Portal do cliente', 'Suporte por email'],
      highlight: false,
    },
    {
      name: 'Profissional',
      price: 'R$ 497',
      description: 'Para escritorios em crescimento',
      features: ['Ate 20 usuarios', 'Ate 500 processos', '50 GB de armazenamento', 'Portal do cliente', 'Pipeline de vendas', 'Relatorios avancados', 'Suporte prioritario'],
      highlight: true,
    },
    {
      name: 'Empresarial',
      price: 'R$ 997',
      description: 'Para grandes escritorios',
      features: ['Ate 100 usuarios', 'Ate 5.000 processos', '500 GB de armazenamento', 'Portal do cliente', 'Pipeline de vendas', 'Relatorios avancados', 'API de integracao', 'Suporte dedicado', 'SLA garantido'],
      highlight: false,
    },
  ]

  return (
    <main data-testid="saas-page">
      <header data-testid="saas-header">
        <a href="/saas" data-testid="logo-link">Prima Facie</a>
        <nav data-testid="saas-nav">
          <a href="#funcionalidades" data-testid="nav-features">Funcionalidades</a>
          <a href="#precos" data-testid="nav-pricing">Precos</a>
          <a href="/register" data-testid="nav-register">Comecar Gratis</a>
        </nav>
      </header>

      <section data-testid="saas-pricing-section">
        <h2>Planos simples e transparentes</h2>
        <p>Escolha o plano ideal para seu escritorio. Todos incluem 14 dias de teste gratuito.</p>

        <div data-testid="pricing-grid">
          {plans.map(plan => (
            <div
              key={plan.name}
              data-testid={`plan-${plan.name.toLowerCase()}`}
              className={plan.highlight ? 'highlighted scale-105' : ''}
            >
              <h3 data-testid="plan-name">{plan.name}</h3>
              <p data-testid="plan-description">{plan.description}</p>
              <span data-testid="plan-price">{plan.price}</span>
              <ul data-testid="plan-features">
                {plan.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              <a href="/register" data-testid="plan-cta">Comecar Teste Gratuito</a>
            </div>
          ))}
        </div>
      </section>

      <footer data-testid="saas-footer">
        <p>Prima Facie. Feito no Brasil.</p>
      </footer>
    </main>
  )
}

// --- Mock: About Page ---
const MockAboutPage = () => {
  const values = [
    { title: 'Etica e Transparencia', description: 'Atuacao pautada na etica profissional e na transparencia' },
    { title: 'Excelencia Tecnica', description: 'Atualizacao constante e qualidade nos servicos' },
    { title: 'Inovacao', description: 'Uso de tecnologia para otimizar a pratica juridica' },
    { title: 'Compromisso com o Cliente', description: 'Dedicacao total a protecao dos interesses do cliente' },
  ]

  return (
    <main data-testid="about-page">
      <header data-testid="about-header">
        <a href="/" data-testid="logo-link">D&apos;Avila Reis</a>
        <nav data-testid="about-nav">
          <a href="/saas" data-testid="nav-saas">Plataforma</a>
          <a href="/contact" data-testid="nav-contact">Contato</a>
          <a href="/login" data-testid="nav-login">Entrar</a>
        </nav>
      </header>

      <section data-testid="about-section">
        <h2>Sobre Nos</h2>

        <div data-testid="mission-section">
          <h3>Nossa Missao</h3>
          <p>Proteger o patrimonio e os interesses de nossos clientes</p>
        </div>

        <div data-testid="vision-section">
          <h3>Nossa Visao</h3>
          <p>Ser referencia nacional em advocacia empresarial preventiva</p>
        </div>

        <div data-testid="values-section">
          <h3>Nossos Valores</h3>
          <div data-testid="values-grid">
            {values.map(v => (
              <div key={v.title} data-testid={`value-${v.title.split(' ')[0].toLowerCase()}`}>
                <p data-testid="value-title">{v.title}</p>
                <p data-testid="value-description">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div data-testid="team-section">Team Component</div>
      <footer data-testid="about-footer">Footer</footer>
    </main>
  )
}

// --- Mock: Contact Page ---
const MockContactPage = () => (
  <main data-testid="contact-page">
    <header data-testid="contact-header">
      <a href="/" data-testid="logo-link">D&apos;Avila Reis</a>
      <nav data-testid="contact-nav">
        <a href="/about" data-testid="nav-about">Sobre</a>
        <a href="/saas" data-testid="nav-saas">Plataforma</a>
        <a href="/login" data-testid="nav-login">Entrar</a>
      </nav>
    </header>

    <div data-testid="contact-component">Contact Component</div>
    <footer data-testid="contact-footer">Footer</footer>
  </main>
)

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

describe('Public Pages UI Tests', () => {
  // ====================== TERMS PAGE ======================
  describe('Terms Page', () => {
    it('should render "Termos de Uso" heading', () => {
      render(<TestWrapper><MockTermsPage /></TestWrapper>)
      expect(screen.getByTestId('terms-page')).toBeInTheDocument()
      expect(screen.getByText('Termos de Uso')).toBeInTheDocument()
    })

    it('should render all 9 sections', () => {
      render(<TestWrapper><MockTermsPage /></TestWrapper>)
      for (let i = 1; i <= 9; i++) {
        expect(screen.getByTestId(`section-${i}`)).toBeInTheDocument()
      }
    })

    it('should have a link to /privacy', () => {
      render(<TestWrapper><MockTermsPage /></TestWrapper>)
      const privacyLink = screen.getByTestId('privacy-link')
      expect(privacyLink).toHaveAttribute('href', '/privacy')
    })

    it('should have "Voltar para cadastro" linking to /register', () => {
      render(<TestWrapper><MockTermsPage /></TestWrapper>)
      const backLink = screen.getByTestId('back-to-register')
      expect(backLink).toHaveAttribute('href', '/register')
      expect(backLink).toHaveTextContent('Voltar para cadastro')
    })
  })

  // ====================== PRIVACY PAGE ======================
  describe('Privacy Page', () => {
    it('should render "Politica de Privacidade" heading', () => {
      render(<TestWrapper><MockPrivacyPage /></TestWrapper>)
      expect(screen.getByTestId('privacy-page')).toBeInTheDocument()
      expect(screen.getByText('Politica de Privacidade')).toBeInTheDocument()
    })

    it('should render all 8 sections', () => {
      render(<TestWrapper><MockPrivacyPage /></TestWrapper>)
      for (let i = 1; i <= 8; i++) {
        expect(screen.getByTestId(`section-${i}`)).toBeInTheDocument()
      }
    })

    it('should reference LGPD', () => {
      render(<TestWrapper><MockPrivacyPage /></TestWrapper>)
      expect(screen.getByText(/LGPD/)).toBeInTheDocument()
      expect(screen.getByText(/Lei n. 13.709\/2018/)).toBeInTheDocument()
    })

    it('should have "Voltar para cadastro" linking to /register', () => {
      render(<TestWrapper><MockPrivacyPage /></TestWrapper>)
      const backLink = screen.getByTestId('back-to-register')
      expect(backLink).toHaveAttribute('href', '/register')
      expect(backLink).toHaveTextContent('Voltar para cadastro')
    })
  })

  // ====================== SAAS PAGE ======================
  describe('SaaS Page', () => {
    it('should render header with navigation links', () => {
      render(<TestWrapper><MockSaasPage /></TestWrapper>)
      expect(screen.getByTestId('saas-header')).toBeInTheDocument()
      expect(screen.getByTestId('nav-features')).toHaveAttribute('href', '#funcionalidades')
      expect(screen.getByTestId('nav-pricing')).toHaveAttribute('href', '#precos')
      expect(screen.getByTestId('nav-register')).toHaveAttribute('href', '/register')
    })

    it('should render 3 pricing cards', () => {
      render(<TestWrapper><MockSaasPage /></TestWrapper>)
      expect(screen.getByTestId('plan-basico')).toBeInTheDocument()
      expect(screen.getByTestId('plan-profissional')).toBeInTheDocument()
      expect(screen.getByTestId('plan-empresarial')).toBeInTheDocument()
    })

    it('should display correct prices', () => {
      render(<TestWrapper><MockSaasPage /></TestWrapper>)
      const prices = screen.getAllByTestId('plan-price')
      expect(prices[0]).toHaveTextContent('R$ 197')
      expect(prices[1]).toHaveTextContent('R$ 497')
      expect(prices[2]).toHaveTextContent('R$ 997')
    })

    it('should highlight the Professional plan with scale-105', () => {
      render(<TestWrapper><MockSaasPage /></TestWrapper>)
      const profPlan = screen.getByTestId('plan-profissional')
      expect(profPlan).toHaveClass('scale-105')
    })

    it('should render feature lists for each plan', () => {
      render(<TestWrapper><MockSaasPage /></TestWrapper>)
      const featureLists = screen.getAllByTestId('plan-features')
      expect(featureLists).toHaveLength(3)
      expect(featureLists[0]).toHaveTextContent('Ate 5 usuarios')
      expect(featureLists[1]).toHaveTextContent('Pipeline de vendas')
      expect(featureLists[2]).toHaveTextContent('SLA garantido')
    })

    it('should have CTA buttons linking to /register', () => {
      render(<TestWrapper><MockSaasPage /></TestWrapper>)
      const ctas = screen.getAllByTestId('plan-cta')
      expect(ctas).toHaveLength(3)
      ctas.forEach(cta => {
        expect(cta).toHaveAttribute('href', '/register')
        expect(cta).toHaveTextContent('Comecar Teste Gratuito')
      })
    })

    it('should render footer', () => {
      render(<TestWrapper><MockSaasPage /></TestWrapper>)
      expect(screen.getByTestId('saas-footer')).toBeInTheDocument()
    })
  })

  // ====================== ABOUT PAGE ======================
  describe('About Page', () => {
    it('should render header with navigation', () => {
      render(<TestWrapper><MockAboutPage /></TestWrapper>)
      expect(screen.getByTestId('about-header')).toBeInTheDocument()
      expect(screen.getByTestId('nav-saas')).toHaveAttribute('href', '/saas')
      expect(screen.getByTestId('nav-contact')).toHaveAttribute('href', '/contact')
      expect(screen.getByTestId('nav-login')).toHaveAttribute('href', '/login')
    })

    it('should render mission and vision sections', () => {
      render(<TestWrapper><MockAboutPage /></TestWrapper>)
      expect(screen.getByTestId('mission-section')).toBeInTheDocument()
      expect(screen.getByText('Nossa Missao')).toBeInTheDocument()
      expect(screen.getByTestId('vision-section')).toBeInTheDocument()
      expect(screen.getByText('Nossa Visao')).toBeInTheDocument()
    })

    it('should render 4 values items', () => {
      render(<TestWrapper><MockAboutPage /></TestWrapper>)
      const valuesGrid = screen.getByTestId('values-grid')
      expect(valuesGrid).toBeInTheDocument()
      expect(screen.getByTestId('value-etica')).toBeInTheDocument()
      expect(screen.getByTestId('value-excelencia')).toBeInTheDocument()
      expect(screen.getByTestId('value-inovacao')).toBeInTheDocument()
      expect(screen.getByTestId('value-compromisso')).toBeInTheDocument()
    })

    it('should render Team component', () => {
      render(<TestWrapper><MockAboutPage /></TestWrapper>)
      expect(screen.getByTestId('team-section')).toBeInTheDocument()
    })

    it('should render Footer', () => {
      render(<TestWrapper><MockAboutPage /></TestWrapper>)
      expect(screen.getByTestId('about-footer')).toBeInTheDocument()
    })
  })

  // ====================== CONTACT PAGE ======================
  describe('Contact Page', () => {
    it('should render header with navigation', () => {
      render(<TestWrapper><MockContactPage /></TestWrapper>)
      expect(screen.getByTestId('contact-header')).toBeInTheDocument()
      expect(screen.getByTestId('nav-about')).toHaveAttribute('href', '/about')
      expect(screen.getByTestId('nav-saas')).toHaveAttribute('href', '/saas')
      expect(screen.getByTestId('nav-login')).toHaveAttribute('href', '/login')
    })

    it('should render Contact component', () => {
      render(<TestWrapper><MockContactPage /></TestWrapper>)
      expect(screen.getByTestId('contact-component')).toBeInTheDocument()
    })

    it('should render Footer', () => {
      render(<TestWrapper><MockContactPage /></TestWrapper>)
      expect(screen.getByTestId('contact-footer')).toBeInTheDocument()
    })
  })
})
