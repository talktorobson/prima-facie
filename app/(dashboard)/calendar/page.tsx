'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { StaffOnly } from '@/components/auth/role-guard'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  CalendarDaysIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  type: 'hearing' | 'meeting' | 'deadline' | 'consultation' | 'other'
  location?: string
  client_id?: string
  client_name?: string
  matter_id?: string
  matter_title?: string
  color: string
  all_day: boolean
  created_at: string
}

const eventTypes = [
  { value: 'hearing', label: 'Audiência', color: 'bg-red-500' },
  { value: 'meeting', label: 'Reunião', color: 'bg-blue-500' },
  { value: 'deadline', label: 'Prazo', color: 'bg-orange-500' },
  { value: 'consultation', label: 'Consulta', color: 'bg-green-500' },
  { value: 'other', label: 'Outro', color: 'bg-purple-500' }
]

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function CalendarPage() {
  const { profile } = useAuthContext()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')

  useEffect(() => {
    fetchEvents()
  }, [currentDate, profile])

  const fetchEvents = async () => {
    if (!profile?.law_firm_id) return

    try {
      setLoading(true)
      
      // Sample events for demonstration
      const sampleEvents: CalendarEvent[] = [
        {
          id: '1',
          title: 'Audiência Trabalhista',
          description: 'Audiência de conciliação - Processo 5001234-20.2024.5.02.0001',
          start_date: new Date().toISOString().split('T')[0],
          start_time: '14:00',
          end_time: '16:00',
          type: 'hearing',
          location: 'Tribunal Regional do Trabalho - Sala 5',
          client_name: 'João Silva Santos',
          matter_title: 'Rescisão Trabalhista Indevida',
          color: 'bg-red-500',
          all_day: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Reunião com Cliente',
          description: 'Reunião para discussão de estratégia processual',
          start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '11:30',
          type: 'meeting',
          location: 'Escritório - Sala de Reuniões',
          client_name: 'Ana Costa Pereira',
          matter_title: 'Divórcio Consensual',
          color: 'bg-blue-500',
          all_day: false,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Prazo Recursal',
          description: 'Prazo para interposição de recurso ordinário',
          start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          type: 'deadline',
          matter_title: 'Ação de Cobrança',
          color: 'bg-orange-500',
          all_day: true,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          title: 'Consulta Jurídica',
          description: 'Primeira consulta - Questões trabalhistas',
          start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          start_time: '15:30',
          end_time: '16:30',
          type: 'consultation',
          location: 'Escritório',
          client_name: 'Maria Silva',
          color: 'bg-green-500',
          all_day: false,
          created_at: new Date().toISOString()
        }
      ]

      setEvents(sampleEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

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
    return events.filter(event => event.start_date === dateString)
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

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setShowEventModal(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setShowEventModal(true)
  }

  const days = getDaysInMonth(currentDate)

  if (loading) {
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
            Gerencie sua agenda de compromissos e prazos
          </p>
        </div>
        <button
          onClick={handleCreateEvent}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Novo Evento
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Hoje
              </button>
              <div className="flex rounded-md shadow-sm">
                {(['month', 'week', 'day'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 text-sm first:rounded-l-md last:rounded-r-md ${
                      viewMode === mode
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {mode === 'month' ? 'Mês' : mode === 'week' ? 'Semana' : 'Dia'}
                  </button>
                ))}
              </div>
            </div>
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
                return <div key={index} className="h-24 p-1"></div>
              }

              const dayEvents = getEventsForDate(date)
              const isCurrentDay = isToday(date)

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(date)}
                  className={`h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    isCurrentDay ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentDay ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                        className={`text-xs p-1 rounded truncate text-white cursor-pointer hover:opacity-80 ${event.color}`}
                      >
                        {event.start_time && !event.all_day && (
                          <span className="mr-1">{formatTime(event.start_time)}</span>
                        )}
                        {event.title}
                      </div>
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
      </div>

      {/* Today's Events */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Eventos de Hoje</h3>
        </div>
        <div className="p-6">
          {events.filter(event => event.start_date === new Date().toISOString().split('T')[0]).length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhum evento para hoje</p>
          ) : (
            <div className="space-y-3">
              {events
                .filter(event => event.start_date === new Date().toISOString().split('T')[0])
                .map((event) => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <div className={`w-3 h-3 rounded-full mr-3 ${event.color}`}></div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                        {!event.all_day && event.start_time && (
                          <span className="text-sm text-gray-500">
                            {formatTime(event.start_time)}
                            {event.end_time && ` - ${formatTime(event.end_time)}`}
                          </span>
                        )}
                      </div>
                      {event.client_name && (
                        <p className="text-sm text-gray-600">Cliente: {event.client_name}</p>
                      )}
                      {event.location && (
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detalhes do Evento</h3>
              <button
                onClick={() => setShowEventDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedEvent.title}</h4>
                <p className="text-sm text-gray-600">{selectedEvent.description}</p>
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <CalendarDaysIcon className="w-4 h-4 mr-2" />
                {new Date(selectedEvent.start_date).toLocaleDateString('pt-BR')}
                {selectedEvent.start_time && !selectedEvent.all_day && (
                  <span className="ml-2">
                    {formatTime(selectedEvent.start_time)}
                    {selectedEvent.end_time && ` - ${formatTime(selectedEvent.end_time)}`}
                  </span>
                )}
              </div>
              
              {selectedEvent.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="w-4 h-4 mr-2" />
                  {selectedEvent.location}
                </div>
              )}
              
              {selectedEvent.client_name && (
                <div className="flex items-center text-sm text-gray-600">
                  <UserIcon className="w-4 h-4 mr-2" />
                  {selectedEvent.client_name}
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowEventDetails(false)
                    setShowEventModal(true)
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  <PencilIcon className="w-4 h-4 inline mr-1" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement delete functionality
                    console.log('Delete event:', selectedEvent.id)
                    setShowEventDetails(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  <TrashIcon className="w-4 h-4 inline mr-1" />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedEvent ? 'Editar Evento' : 'Novo Evento'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              
              // TODO: Implement actual event creation/update
              console.log('Event data:', Object.fromEntries(formData))
              alert(selectedEvent ? 'Evento atualizado!' : 'Evento criado!')
              setShowEventModal(false)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={selectedEvent?.title}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: Audiência Trabalhista"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    defaultValue={selectedEvent?.description}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Detalhes do evento..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data
                    </label>
                    <input
                      type="date"
                      name="date"
                      defaultValue={selectedEvent?.start_date || selectedDate?.toISOString().split('T')[0]}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      name="type"
                      defaultValue={selectedEvent?.type || 'other'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {eventTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Início
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      defaultValue={selectedEvent?.start_time}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Fim
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      defaultValue={selectedEvent?.end_time}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Local
                  </label>
                  <input
                    type="text"
                    name="location"
                    defaultValue={selectedEvent?.location}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: Tribunal de Justiça - Sala 10"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="all_day"
                    name="all_day"
                    defaultChecked={selectedEvent?.all_day}
                    className="mr-2"
                  />
                  <label htmlFor="all_day" className="text-sm text-gray-700">
                    Dia inteiro
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                  >
                    {selectedEvent ? 'Atualizar' : 'Criar'} Evento
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </StaffOnly>
  )
}