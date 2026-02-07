'use client'

import { cn } from '@/lib/utils/cn'

interface AISuggestionChipsProps {
  route: string
  onSelect: (text: string) => void
  disabled?: boolean
}

const SUGGESTIONS: Record<string, string[]> = {
  '/matters': [
    'Listar processos ativos',
    'Resumo dos prazos',
    'Processos com prioridade urgente',
  ],
  '/clients': [
    'Buscar cliente por CPF',
    'Clientes sem processo',
    'Clientes ativos',
  ],
  '/tasks': [
    'Tarefas pendentes',
    'Tarefas atrasadas',
    'Tarefas de alta prioridade',
  ],
  '/billing': [
    'Faturas em aberto',
    'Horas não faturadas',
    'Resumo financeiro',
  ],
  '/dashboard': [
    'Resumo do escritório',
    'Próximos prazos',
    'Estatísticas gerais',
  ],
  '/calendar': [
    'Próximas audiências',
    'Prazos da semana',
    'Eventos dos próximos 30 dias',
  ],
  '/documents': [
    'Documentos recentes',
    'Documentos por processo',
  ],
  '/reports': [
    'Estatísticas do escritório',
    'Resumo mensal',
  ],
}

const DEFAULT_SUGGESTIONS = [
  'Resumo do escritório',
  'Próximos prazos',
  'Tarefas pendentes',
]

export function AISuggestionChips({ route, onSelect, disabled }: AISuggestionChipsProps) {
  const basePath = '/' + (route.split('/').filter(Boolean)[0] || 'dashboard')
  const suggestions = SUGGESTIONS[basePath] || DEFAULT_SUGGESTIONS

  return (
    <div className="flex flex-wrap gap-1.5 px-4 py-2">
      {suggestions.map((text) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          disabled={disabled}
          className={cn(
            'rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600',
            'hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {text}
        </button>
      ))}
    </div>
  )
}
