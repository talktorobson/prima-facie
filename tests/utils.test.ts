import { cn } from '../lib/utils/cn'

describe('Utility Functions', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('bg-red-500', 'text-white')
      expect(result).toBe('bg-red-500 text-white')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class')
      expect(result).toBe('base-class conditional-class')
    })

    it('should handle undefined values', () => {
      const result = cn('base-class', undefined, 'valid-class')
      expect(result).toBe('base-class valid-class')
    })

    it('should work with no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })
  })
})