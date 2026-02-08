'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils/cn'

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItem[]
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  breadcrumbs,
  title,
  description,
  backHref,
  backLabel,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb items={breadcrumbs} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backLabel ?? 'Voltar'}</span>
            </Link>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-gray-600">{description}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
