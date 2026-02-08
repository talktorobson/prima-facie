'use client'

import { useRef, useEffect, type ReactNode } from 'react'

interface WebsiteScrollRevealProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: number
  threshold?: number
  className?: string
}

function getTransform(direction: 'up' | 'down' | 'left' | 'right'): string {
  switch (direction) {
    case 'up':
      return 'translateY(24px)'
    case 'down':
      return 'translateY(-24px)'
    case 'left':
      return 'translateX(24px)'
    case 'right':
      return 'translateX(-24px)'
  }
}

// Shared observer pool — one IntersectionObserver per threshold value
const observerPool = new Map<number, IntersectionObserver>()
const callbacks = new WeakMap<Element, () => void>()

function getSharedObserver(threshold: number): IntersectionObserver {
  let observer = observerPool.get(threshold)
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const cb = callbacks.get(entry.target)
            if (cb) {
              cb()
              callbacks.delete(entry.target)
            }
            observer!.unobserve(entry.target)
          }
        }
      },
      { threshold }
    )
    observerPool.set(threshold, observer)
  }
  return observer
}

export default function WebsiteScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  duration = 600,
  threshold = 0.1,
  className = '',
}: WebsiteScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = getSharedObserver(threshold)

    callbacks.set(el, () => {
      el.style.opacity = '1'
      el.style.transform = 'none'
    })

    observer.observe(el)
    return () => {
      observer.unobserve(el)
      callbacks.delete(el)
    }
  }, [threshold])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: getTransform(direction),
        transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}
