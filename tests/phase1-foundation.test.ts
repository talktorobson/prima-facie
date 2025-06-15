/**
 * Phase 1 Foundation Tests
 * Tests for basic project setup without external dependencies
 */

import { cn } from '../lib/utils/cn'

describe('Phase 1: Foundation Setup', () => {
  describe('Project Environment', () => {
    it('should have Node.js environment', () => {
      expect(process.env.NODE_ENV).toBeDefined()
    })

    it('should have test environment configured', () => {
      expect(typeof expect).toBe('function')
      expect(typeof describe).toBe('function')
      expect(typeof it).toBe('function')
    })

    it('should have DOM environment available (jsdom)', () => {
      expect(typeof window).toBe('object')
      expect(typeof document).toBe('object')
    })
  })

  describe('Utility Functions', () => {
    describe('cn (className merger)', () => {
      it('should be importable', () => {
        expect(typeof cn).toBe('function')
      })

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

      it('should return empty string for no arguments', () => {
        expect(cn()).toBe('')
      })
    })
  })

  describe('TypeScript Configuration', () => {
    it('should support module imports', () => {
      expect(() => {
        require('../lib/utils/cn')
      }).not.toThrow()
    })

    it('should have proper types', () => {
      const result: string = cn('test')
      expect(typeof result).toBe('string')
    })
  })

  describe('Jest Configuration', () => {
    it('should support ES6 imports', () => {
      expect(typeof cn).toBe('function')
    })

    it('should have DOM testing utilities', () => {
      const div = document.createElement('div')
      div.className = cn('test-class')
      expect(div.className).toBe('test-class')
    })

    it('should support async/await', async () => {
      const promise = Promise.resolve('test')
      const result = await promise
      expect(result).toBe('test')
    })
  })

  describe('Next.js Mocks', () => {
    it('should have mocked useRouter', () => {
      const { useRouter } = require('next/navigation')
      const router = useRouter()
      expect(router.push).toBeDefined()
      expect(typeof router.push).toBe('function')
      expect(router.refresh).toBeDefined()
      expect(typeof router.refresh).toBe('function')
    })

    it('should have mocked useSearchParams', () => {
      const { useSearchParams } = require('next/navigation')
      const searchParams = useSearchParams()
      expect(searchParams).toBeInstanceOf(URLSearchParams)
    })

    it('should have mocked usePathname', () => {
      const { usePathname } = require('next/navigation')
      const pathname = usePathname()
      expect(typeof pathname).toBe('string')
      expect(pathname).toBe('/')
    })
  })
})