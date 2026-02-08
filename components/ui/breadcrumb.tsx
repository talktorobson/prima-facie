'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface BreadcrumbItem {
  label: string
  href?: string
  icon?: React.ComponentType<{ className?: string }>
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isMiddle = index > 0 && index < items.length - 1
          const Icon = item.icon

          return (
            <li
              key={`${item.label}-${index}`}
              className={cn(
                'flex items-center gap-1.5',
                isMiddle && 'hidden sm:flex'
              )}
            >
              {index > 0 && (
                <ChevronRight
                  className={cn(
                    'h-3.5 w-3.5 text-gray-400 flex-shrink-0',
                    isMiddle && 'hidden sm:block'
                  )}
                />
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="flex items-center gap-1 text-gray-700 font-medium truncate"
                >
                  {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href ?? '#'}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors truncate"
                >
                  {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
