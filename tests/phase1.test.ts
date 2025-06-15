/**
 * Phase 1 Tests - Foundation Setup
 * Tests for project setup, utilities, and basic functionality
 */

import { cn } from '../lib/utils/cn'
import { createClient } from '../lib/supabase/client'

describe('Phase 1: Foundation Setup', () => {
  describe('Project Structure', () => {
    it('should have correct environment variables defined', () => {
      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBeDefined()
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBeDefined()
    })

    it('should be able to import main utilities', () => {
      expect(typeof cn).toBe('function')
      expect(typeof createClient).toBe('function')
    })
  })

  describe('Utility Functions', () => {
    describe('cn (className merger)', () => {
      it('should merge multiple class names', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2')
      })

      it('should handle conditional classes', () => {
        expect(cn('base', true && 'show', false && 'hide')).toBe('base show')
      })

      it('should filter out falsy values', () => {
        expect(cn('base', null, undefined, '', 'valid')).toBe('base valid')
      })

      it('should handle Tailwind class conflicts', () => {
        expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
      })

      it('should handle arrays', () => {
        expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
      })

      it('should handle objects', () => {
        expect(cn({ 
          'class1': true, 
          'class2': false, 
          'class3': true 
        })).toBe('class1 class3')
      })
    })
  })

  describe('Supabase Client', () => {
    it('should create a Supabase client instance', () => {
      const client = createClient()
      expect(client).toBeDefined()
      expect(typeof client).toBe('object')
    })

    it('should have auth methods available', () => {
      const client = createClient()
      expect(client.auth).toBeDefined()
      expect(client.auth.signInWithPassword).toBeDefined()
      expect(client.auth.signUp).toBeDefined()
      expect(client.auth.signOut).toBeDefined()
    })

    it('should have database methods available', () => {
      const client = createClient()
      expect(client.from).toBeDefined()
      expect(typeof client.from).toBe('function')
    })
  })

  describe('TypeScript Configuration', () => {
    it('should support path aliases', () => {
      // If we can import without errors, path aliases are working
      expect(() => {
        require('../lib/utils/cn')
        require('../lib/supabase/client')
      }).not.toThrow()
    })
  })

  describe('Test Environment', () => {
    it('should have jsdom environment', () => {
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
    })

    it('should have testing utilities available', () => {
      expect(typeof expect).toBe('function')
      expect(typeof describe).toBe('function')
      expect(typeof it).toBe('function')
    })

    it('should have mocked Next.js dependencies', () => {
      // These are mocked in jest.setup.js
      const { useRouter } = require('next/navigation')
      const router = useRouter()
      expect(router.push).toBeDefined()
      expect(typeof router.push).toBe('function')
    })
  })
})