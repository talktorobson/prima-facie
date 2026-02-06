import { cn } from '@/lib/utils/cn'

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('bg-red-500', 'text-white')
    expect(result).toBe('bg-red-500 text-white')
  })

  it('should handle conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class', false && 'ignored-class')
    expect(result).toBe('base-class conditional-class')
  })

  it('should handle undefined and null values', () => {
    const result = cn('base-class', undefined, null, 'valid-class')
    expect(result).toBe('base-class valid-class')
  })

  it('should handle empty strings', () => {
    const result = cn('base-class', '', 'valid-class')
    expect(result).toBe('base-class valid-class')
  })

  it('should work with no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should merge Tailwind conflicting classes', () => {
    const result = cn('bg-red-500', 'bg-blue-500')
    expect(result).toBe('bg-blue-500')
  })

  it('should handle arrays of classes', () => {
    const result = cn(['bg-red-500', 'text-white'], 'p-4')
    expect(result).toBe('bg-red-500 text-white p-4')
  })

  it('should handle objects with boolean values', () => {
    const result = cn({
      'bg-red-500': true,
      'text-white': false,
      'p-4': true,
    })
    expect(result).toBe('bg-red-500 p-4')
  })
})