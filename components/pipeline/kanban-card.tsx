'use client'

import { Draggable } from '@hello-pangea/dnd'
import {
  CurrencyDollarIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'

interface KanbanCardProps {
  card: {
    id: string
    name: string
    estimated_value?: number
    probability: number
    source: string
    next_follow_up?: string
  }
  index: number
  onView: (id: string) => void
  onEdit: (id: string) => void
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR')

export default function KanbanCard({ card, index, onView, onEdit }: KanbanCardProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border p-3 mb-2 shadow-sm ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/30' : 'hover:shadow-md'} transition-shadow`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 truncate flex-1">{card.name}</h4>
            <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
              <button onClick={() => onView(card.id)} className="p-1 text-gray-400 hover:text-primary rounded">
                <EyeIcon className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onEdit(card.id)} className="p-1 text-gray-400 hover:text-primary rounded">
                <PencilIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {card.estimated_value != null && card.estimated_value > 0 && (
            <div className="flex items-center text-xs text-green-700 mb-1">
              <CurrencyDollarIcon className="h-3.5 w-3.5 mr-1" />
              {formatCurrency(card.estimated_value)}
              <span className="ml-1 text-gray-500">({card.probability}%)</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="bg-gray-100 rounded px-1.5 py-0.5">{card.source}</span>
            {card.next_follow_up && (
              <span className="flex items-center">
                <CalendarIcon className="h-3 w-3 mr-0.5" />
                {formatDate(card.next_follow_up)}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}
