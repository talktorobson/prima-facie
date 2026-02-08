'use client'

import { Users } from 'lucide-react'

interface ClientCardProps {
  client: Record<string, unknown>
}

export function ClientCard({ client }: ClientCardProps) {
  const name = String(client.full_name || client.company_name || 'Sem nome')
  const isCompany = client.contact_type === 'company'
  const doc = isCompany ? String(client.cnpj || '') : String(client.cpf || '')

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-2">
        <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{name}</p>
          <p className="text-gray-500 mt-0.5">
            {isCompany ? 'Pessoa Jurídica' : 'Pessoa Física'}
            {doc ? ` — ${doc}` : ''}
          </p>
          {client.email ? (
            <p className="text-gray-400 mt-0.5 truncate">{String(client.email)}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
