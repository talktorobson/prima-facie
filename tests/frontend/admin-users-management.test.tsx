/**
 * Frontend tests for admin user management page
 * Tests password fields visibility, validation, and submit flow
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock all external dependencies
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/admin/users',
}))

const mockToast = { success: jest.fn(), error: jest.fn(), info: jest.fn() }
jest.mock('@/components/ui/toast-provider', () => ({
  useToast: () => mockToast,
}))

const mockCreateUser = { mutate: jest.fn(), isPending: false }
const mockUpdateUser = { mutate: jest.fn(), isPending: false }
const mockDeactivateUser = { mutate: jest.fn(), isPending: false }

jest.mock('@/lib/queries/useAdmin', () => ({
  useUsers: () => ({
    data: [
      {
        id: 'u1',
        first_name: 'Maria',
        last_name: 'Silva',
        email: 'maria@firma.com',
        user_type: 'lawyer',
        status: 'active',
        last_login_at: '2026-01-15T10:00:00Z',
        created_at: '2025-06-01T08:00:00Z',
        oab_number: 'OAB/SP 123',
        position: 'Socia',
        phone: '11999999999',
        law_firm_id: 'firm-1',
      },
    ],
    isLoading: false,
  }),
  useCreateUser: () => mockCreateUser,
  useUpdateUser: () => mockUpdateUser,
  useDeactivateUser: () => mockDeactivateUser,
}))

jest.mock('@/lib/hooks/use-effective-law-firm-id', () => ({
  useEffectiveLawFirmId: () => 'firm-1',
}))

jest.mock('@/components/auth/role-guard', () => ({
  AdminOnly: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@heroicons/react/24/outline', () => ({
  UsersIcon: () => <span data-testid="users-icon" />,
  ArrowLeftIcon: () => <span data-testid="arrow-left" />,
  MagnifyingGlassIcon: () => <span data-testid="search-icon" />,
  UserPlusIcon: () => <span data-testid="user-plus" />,
  PencilIcon: () => <span data-testid="pencil" />,
  TrashIcon: () => <span data-testid="trash" />,
  ShieldCheckIcon: () => <span data-testid="shield-check" />,
  ShieldExclamationIcon: () => <span data-testid="shield-exclamation" />,
  XMarkIcon: () => <span data-testid="x-mark" />,
}))

// Import component after all mocks
import UsersManagementPage from '@/app/(dashboard)/admin/users/page'

describe('UsersManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders user list', () => {
    render(<UsersManagementPage />)
    expect(screen.getByText('Gestao de Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    expect(screen.getByText('maria@firma.com')).toBeInTheDocument()
  })

  it('shows stats cards', () => {
    render(<UsersManagementPage />)
    expect(screen.getByText('Total de Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Usuarios Ativos')).toBeInTheDocument()
  })

  describe('Create modal', () => {
    it('shows password fields when creating', () => {
      render(<UsersManagementPage />)
      fireEvent.click(screen.getByText('Adicionar Usuario'))

      expect(screen.getByText('Senha *')).toBeInTheDocument()
      expect(screen.getByText('Confirmar Senha')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Minimo 8 caracteres')).toBeInTheDocument()
    })

    it('has correct form fields for creation', () => {
      render(<UsersManagementPage />)
      fireEvent.click(screen.getByText('Adicionar Usuario'))

      expect(screen.getByText('Email *')).toBeInTheDocument()
      expect(screen.getByText('Senha *')).toBeInTheDocument()
      expect(screen.getByText('Nome *')).toBeInTheDocument()
      expect(screen.getByText('Sobrenome *')).toBeInTheDocument()
      expect(screen.getByText('Tipo de Usuario *')).toBeInTheDocument()
      expect(screen.getByText('OAB')).toBeInTheDocument()
      expect(screen.getByText('Cargo')).toBeInTheDocument()
      expect(screen.getByText('Telefone')).toBeInTheDocument()
    })

    it('does not show status field when creating', () => {
      render(<UsersManagementPage />)
      fireEvent.click(screen.getByText('Adicionar Usuario'))

      // Status select with "Pendente" option only appears in edit mode
      // The filter dropdown has "Suspenso" but not "Pendente"
      const pendenteOptions = screen.queryByText('Pendente')
      expect(pendenteOptions).not.toBeInTheDocument()
    })

    it('closes modal on cancel', () => {
      render(<UsersManagementPage />)
      fireEvent.click(screen.getByText('Adicionar Usuario'))
      expect(screen.getByText('Senha *')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Cancelar'))
      expect(screen.queryByText('Senha *')).not.toBeInTheDocument()
    })
  })

  describe('Edit modal', () => {
    it('does NOT show password fields when editing', () => {
      render(<UsersManagementPage />)

      // Click the edit button (pencil icon in the actions column)
      const editButtons = screen.getAllByTitle('Editar')
      fireEvent.click(editButtons[0])

      // Password fields should not be present
      expect(screen.queryByText('Senha *')).not.toBeInTheDocument()
      expect(screen.queryByText('Confirmar Senha')).not.toBeInTheDocument()

      // Status select options should appear in edit mode (Ativo, Inativo, Suspenso, Pendente)
      expect(screen.getByText('Pendente')).toBeInTheDocument()
    })

    it('pre-fills form with user data', () => {
      render(<UsersManagementPage />)
      const editButtons = screen.getAllByTitle('Editar')
      fireEvent.click(editButtons[0])

      // Email should be disabled when editing
      const emailInput = screen.getByDisplayValue('maria@firma.com')
      expect(emailInput).toBeDisabled()
    })

    it('shows "Editar Usuario" title', () => {
      render(<UsersManagementPage />)
      const editButtons = screen.getAllByTitle('Editar')
      fireEvent.click(editButtons[0])

      expect(screen.getByText('Editar Usuario')).toBeInTheDocument()
    })
  })

  describe('Deactivation', () => {
    it('calls deactivate on confirm', () => {
      window.confirm = jest.fn(() => true)
      render(<UsersManagementPage />)

      const deactivateButtons = screen.getAllByTitle('Desativar')
      fireEvent.click(deactivateButtons[0])

      expect(window.confirm).toHaveBeenCalled()
      expect(mockDeactivateUser.mutate).toHaveBeenCalledWith('u1', expect.any(Object))
    })

    it('does not deactivate on cancel', () => {
      window.confirm = jest.fn(() => false)
      render(<UsersManagementPage />)

      const deactivateButtons = screen.getAllByTitle('Desativar')
      fireEvent.click(deactivateButtons[0])

      expect(mockDeactivateUser.mutate).not.toHaveBeenCalled()
    })
  })

  describe('Search and filters', () => {
    it('filters by search term', () => {
      render(<UsersManagementPage />)

      const searchInput = screen.getByPlaceholderText('Buscar por nome ou email...')
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } })

      expect(screen.getByText('Nenhum usuario encontrado')).toBeInTheDocument()
    })

    it('shows user when search matches', () => {
      render(<UsersManagementPage />)

      const searchInput = screen.getByPlaceholderText('Buscar por nome ou email...')
      fireEvent.change(searchInput, { target: { value: 'maria' } })

      expect(screen.getByText('Maria Silva')).toBeInTheDocument()
    })
  })
})
