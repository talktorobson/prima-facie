// =====================================================
// Prima Facie - Mock Authentication for Testing
// Temporary mock auth system for frontend testing
// =====================================================

export const mockUsers = [
  {
    id: '1',
    email: 'admin@test.com',
    password: '123456',
    profile: {
      id: '723e4567-e89b-12d3-a456-426614174000',
      law_firm_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'admin@test.com',
      first_name: 'Admin',
      last_name: 'Test',
      user_type: 'admin' as const,
      status: 'active' as const,
      oab_number: 'OAB/SP 123456',
      position: 'Administrador',
      law_firm: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Dávila Reis Advocacia',
        plan_type: 'professional' as const,
        subscription_active: true,
        primary_color: '#0066CC'
      }
    }
  },
  {
    id: '2', 
    email: 'lawyer@test.com',
    password: '123456',
    profile: {
      id: '823e4567-e89b-12d3-a456-426614174000',
      law_firm_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'lawyer@test.com',
      first_name: 'Maria',
      last_name: 'Silva',
      user_type: 'lawyer' as const,
      status: 'active' as const,
      oab_number: 'OAB/SP 234567',
      position: 'Advogada Sênior',
      law_firm: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Dávila Reis Advocacia', 
        plan_type: 'professional' as const,
        subscription_active: true,
        primary_color: '#0066CC'
      }
    }
  },
  {
    id: '3',
    email: 'client@test.com', 
    password: '123456',
    profile: {
      id: '923e4567-e89b-12d3-a456-426614174000',
      law_firm_id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'client@test.com',
      first_name: 'Ana',
      last_name: 'Costa',
      user_type: 'client' as const,
      status: 'active' as const,
      position: 'Cliente',
      law_firm: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Dávila Reis Advocacia',
        plan_type: 'professional' as const,
        subscription_active: true,
        primary_color: '#0066CC'
      }
    }
  }
]

export const mockAuth = {
  signIn: async (email: string, password: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const user = mockUsers.find(u => u.email === email && u.password === password)
    
    if (!user) {
      return { error: 'Email ou senha inválidos' }
    }
    
    // Store in localStorage and cookie for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_auth_user', JSON.stringify(user))
      // Set cookie for middleware access
      document.cookie = `mock_auth_user=${JSON.stringify(user)}; path=/; max-age=86400; SameSite=lax`
    }
    
    return { user: user.profile }
  },
  
  signUp: async (email: string, password: string, userData: any) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email)
    if (existingUser) {
      return { error: 'Este email já está cadastrado' }
    }
    
    const newUser = {
      id: Math.random().toString(),
      email,
      password,
      profile: {
        id: Math.random().toString(),
        law_firm_id: '123e4567-e89b-12d3-a456-426614174000',
        email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        user_type: userData.user_type || 'admin',
        status: 'active' as const,
        oab_number: userData.oab_number,
        law_firm: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Dávila Reis Advocacia',
          plan_type: 'professional' as const,
          subscription_active: true,
          primary_color: '#0066CC'
        }
      }
    }
    
    // Store in localStorage and cookie for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_auth_user', JSON.stringify(newUser))
      // Set cookie for middleware access  
      document.cookie = `mock_auth_user=${JSON.stringify(newUser)}; path=/; max-age=86400; SameSite=lax`
    }
    
    return { user: newUser.profile }
  },
  
  signOut: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_auth_user')
      // Remove cookie
      document.cookie = 'mock_auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
    }
    return {}
  },
  
  getSession: () => {
    // Always return null during SSR to prevent hydration mismatch
    if (typeof window === 'undefined') {
      return { user: null }
    }
    
    try {
      const stored = localStorage.getItem('mock_auth_user')
      if (stored) {
        const user = JSON.parse(stored)
        return { user: user.profile }
      }
    } catch (error) {
      console.error('Error reading mock auth session:', error)
    }
    
    return { user: null }
  }
}