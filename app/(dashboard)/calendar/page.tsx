'use client'

import { useState } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { StaffOnly } from '@/components/auth/role-guard'
import { useCalendarEvents } from '@/lib/queries/useCalendarEvents'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'task' | 'court_date' | 'invoice_due'
  color: string
  source_table: string
  source_id: string
  matter_id?: string
  matter_title?: string
}

const eventTypeLabels: Record<string, string> = {
  task: 'Tarefa',
  court_date: 'Audiência',
  invoice_due: 'Vencimento de Fatura'
}

const eventTypeColors: Record<string, string> = {
  task: 'bg-blue-500',
  court_date: 'bg-red-500',
  invoice_due: 'bg-orange-500'
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CalendarPage() {
  const { profile } = useAuthContext()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDetails, setShowEventDetails] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1 // JavaScript months are 0-indexed

  const { data: events = [], isLoading } = useCalendarEvents(profile?.law_firm_id, year, month)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingWeekday = firstDay.getDay()

    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingWeekday; i++) {
      days.push(null)
    }

    // Add all days in month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateString)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const getSourceLink = (event: CalendarEvent): string => {
    switch (event.type) {
      case 'task':
        return '/tasks'
      case 'court_date':
        return event.matter_id ? `/matters` : '/matters'
      case 'invoice_due':
        return '/billing'
      default:
        return '#'
    }
  }

  const days = getDaysInMonth(currentDate)
  const todayEvents = events.filter(event => event.date === new Date().toISOString().split('T')[0])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <StaffOnly
      fallback={
        <div className="min-h-64 flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">Você não tem permissão para acessar o calendário interno.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendário</h1>
            <p className="mt-2 text-gray-600">
              Visualize compromissos, audiências e prazos em um só lugar
            </p>
          </div>

          {/* Color Legend */}
          <div className="flex items-center space-x-4 text-sm">
            {Object.entries(eventTypeLabels).map(([type, label]) => (
              <div key={type} className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded ${eventTypeColors[type]}`}></div>
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Mês anterior"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">
                  {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Próximo mês"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Hoje
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {weekDays.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-24 p-1"></div>
                }

                const dayEvents = getEventsForDate(date)
                const isCurrentDay = isToday(date)

                return (
                  <div
                    key={date.toISOString()}
                    className={`h-24 p-2 border border-gray-200 ${
                      isCurrentDay ? 'bg-blue-50 border-blue-300' : 'bg-white'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => handleEventClick(event)}
                          className={`w-full text-left text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-80 ${event.color}`}
                        >
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayEvents.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Empty State */}
          {events.length === 0 && (
            <div className="px-6 pb-6">
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum evento neste mês
                </h3>
                <p className="text-gray-600">
                  Eventos de tarefas, audiências e faturas aparecerão aqui automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Today's Events */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Eventos de Hoje</h3>
          </div>
          <div className="p-6">
            {todayEvents.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum evento para hoje</p>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="w-full flex items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer text-left"
                  >
                    <div className={`w-3 h-3 rounded-full mr-3 mt-1.5 flex-shrink-0 ${event.color}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                        <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
                          {eventTypeLabels[event.type]}
                        </span>
                      </div>
                      {event.matter_title && (
                        <p className="text-sm text-gray-600 truncate">
                          Processo: {event.matter_title}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Event Details Modal */}
        {showEventDetails && selectedEvent && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
            onClick={() => setShowEventDetails(false)}
          >
            <div
              className="relative top-20 mx-auto p-6 border w-96 shadow-lg rounded-md bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detalhes do Evento</h3>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Fechar"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${selectedEvent.color}`}></div>
                    <span className="text-sm font-medium text-gray-500">
                      {eventTypeLabels[selectedEvent.type]}
                    </span>
                  </div>
                  <h4 className="font-medium text-gray-900 text-lg">{selectedEvent.title}</h4>
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDaysIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                  {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>

                {selectedEvent.matter_title && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Processo:</span>
                    <p className="text-gray-600 mt-1">{selectedEvent.matter_title}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Link
                    href={getSourceLink(selectedEvent)}
                    onClick={() => setShowEventDetails(false)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4 mr-2" />
                    {selectedEvent.type === 'task' && 'Ver Tarefa'}
                    {selectedEvent.type === 'court_date' && 'Ver Processo'}
                    {selectedEvent.type === 'invoice_due' && 'Ver Fatura'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffOnly>
  )
}
