'use client'

import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
import KanbanCard from './kanban-card'

interface Stage {
  id: string
  name: string
  sort_order: number
  stage_type?: string
}

interface Card {
  id: string
  name: string
  estimated_value?: number
  probability: number
  source: string
  next_follow_up?: string
  pipeline_stage_id: string
}

interface KanbanBoardProps {
  stages: Stage[]
  cards: Card[]
  onMoveCard: (cardId: string, targetStageId: string) => void
  onViewCard: (cardId: string) => void
  onEditCard: (cardId: string) => void
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const stageColors: Record<string, string> = {
  new: 'bg-blue-500',
  active: 'bg-yellow-500',
  qualified: 'bg-green-500',
  proposal: 'bg-purple-500',
  hired: 'bg-emerald-500',
  not_hired: 'bg-red-500',
}

export default function KanbanBoard({ stages, cards, onMoveCard, onViewCard, onEditCard }: KanbanBoardProps) {
  const activeStages = stages
    .filter(s => s.stage_type !== 'not_hired')
    .sort((a, b) => a.sort_order - b.sort_order)

  // Add "not_hired" at end if it exists
  const notHired = stages.find(s => s.stage_type === 'not_hired')
  const sortedStages = notHired ? [...activeStages, notHired] : activeStages

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const cardId = result.draggableId
    const targetStageId = result.destination.droppableId
    if (result.source.droppableId !== targetStageId) {
      onMoveCard(cardId, targetStageId)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
        {sortedStages.map((stage) => {
          const stageCards = cards.filter(c => c.pipeline_stage_id === stage.id)
          const totalValue = stageCards.reduce((sum, c) => sum + (c.estimated_value || 0), 0)
          const colorClass = stageColors[stage.stage_type || ''] || 'bg-gray-500'

          return (
            <div key={stage.id} className="flex-shrink-0 w-72">
              {/* Column header */}
              <div className="bg-white rounded-t-lg border border-b-0 p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <div className={`w-2.5 h-2.5 rounded-full ${colorClass} mr-2`} />
                    <h3 className="text-sm font-semibold text-gray-900">{stage.name}</h3>
                  </div>
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                    {stageCards.length}
                  </span>
                </div>
                {totalValue > 0 && (
                  <div className="flex items-center text-xs text-gray-500">
                    <CurrencyDollarIcon className="h-3.5 w-3.5 mr-1" />
                    {formatCurrency(totalValue)}
                  </div>
                )}
              </div>

              {/* Droppable column */}
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`rounded-b-lg border border-t-0 p-2 min-h-[400px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-gray-50'
                    }`}
                  >
                    {stageCards.map((card, index) => (
                      <KanbanCard
                        key={card.id}
                        card={card}
                        index={index}
                        onView={onViewCard}
                        onEdit={onEditCard}
                      />
                    ))}
                    {provided.placeholder}
                    {stageCards.length === 0 && (
                      <div className="text-center py-8 text-xs text-gray-400">
                        Arraste leads aqui
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
