'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface AlertProps {
  variant?: 'default' | 'destructive'
  children: React.ReactNode
  className?: string
}

interface AlertTitleProps {
  children: React.ReactNode
  className?: string
}

interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function Alert({ variant = 'default', children, className }: AlertProps) {
  return (
    <div
      className={cn(
        'relative w-full rounded-lg border p-4',
        variant === 'default' && 'bg-white border-gray-200',
        variant === 'destructive' && 'bg-red-50 border-red-200 text-red-900',
        className
      )}
    >
      {children}
    </div>
  )
}

export function AlertTitle({ children, className }: AlertTitleProps) {
  return (
    <h5 className={cn('mb-1 font-medium leading-none tracking-tight', className)}>
      {children}
    </h5>
  )
}

export function AlertDescription({ children, className }: AlertDescriptionProps) {
  return (
    <div className={cn('text-sm [&_p]:leading-relaxed', className)}>
      {children}
    </div>
  )
}