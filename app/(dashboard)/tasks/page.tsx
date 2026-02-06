'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { StaffOnly } from '@/components/auth/role-guard'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  CalendarIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ChevronDownIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline'

interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'case_work' | 'administrative' | 'client_meeting' | 'court_appearance' | 'research' | 'document_review' | 'other'
  assigned_to?: string
  assigned_lawyer?: string
  client_id?: string
  client_name?: string
  matter_id?: string
  matter_title?: string
  due_date?: string
  start_time?: string
  estimated_hours?: number
  actual_hours?: number
  created_at: string
  updated_at: string
  completed_at?: string
}

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' }
]

const priorityOptions = [
  { value: '', label: 'Todas as Prioridades' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' }
]

const categoryOptions = [
  { value: 'case_work', label: 'Trabalho em Caso' },
  { value: 'administrative', label: 'Administrativo' },
  { value: 'client_meeting', label: 'Reunião com Cliente' },
  { value: 'court_appearance', label: 'Comparecimento no Tribunal' },
  { value: 'research', label: 'Pesquisa Jurídica' },
  { value: 'document_review', label: 'Revisão de Documentos' },
  { value: 'other', label: 'Outros' }
]

export default function TasksPage() {
  const { profile } = useAuthContext()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')

  // Task stats
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgress: 0,
    completedToday: 0,
    overdueTasks: 0,
    highPriorityTasks: 0
  })

  useEffect(() => {
    fetchTasks()
  }, [profile])

  useEffect(() => {
    filterTasks()
  }, [searchTerm, statusFilter, priorityFilter, tasks])

  const fetchTasks = async () => {
    if (!profile?.law_firm_id) return

    try {
      setLoading(true)
      
      // Sample tasks for demonstration
      const sampleTasks: Task[] = [
        {
          id: '1',
          title: 'Preparar petição inicial para ação trabalhista',
          description: 'Elaborar petição inicial para o caso de rescisão indevida do Sr. João Silva',
          status: 'in_progress',
          priority: 'high',
          category: 'case_work',
          assigned_lawyer: 'Maria Advogada',
          client_name: 'João Silva Santos',
          matter_title: 'Rescisão Trabalhista Indevida',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_hours: 4,
          actual_hours: 2.5,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Revisar contrato de parceria - Empresa ABC',
          description: 'Análise completa do contrato de parceria comercial',
          status: 'pending',
          priority: 'medium',
          category: 'document_review',
          assigned_lawyer: 'Pedro Advogado',
          client_name: 'Empresa ABC Ltda',
          matter_title: 'Revisão Contratual',
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_hours: 3,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          title: 'Audiência de conciliação - TRT',
          description: 'Comparecer à audiência de conciliação no Tribunal Regional do Trabalho',
          status: 'pending',
          priority: 'critical',
          category: 'court_appearance',
          assigned_lawyer: 'João Advogado',
          client_name: 'Ana Costa Pereira',
          matter_title: 'Ação de Cobrança',
          due_date: new Date().toISOString(), // Today - overdue
          start_time: '14:00',
          estimated_hours: 2,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          title: 'Pesquisa jurisprudencial sobre união estável',
          description: 'Levantar jurisprudência recente sobre união estável e partilha de bens',
          status: 'completed',
          priority: 'low',
          category: 'research',
          assigned_lawyer: 'Maria Advogada',
          client_name: 'Carlos Oliveira',
          matter_title: 'Dissolução de União Estável',
          due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          estimated_hours: 2,
          actual_hours: 1.5,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          title: 'Reunião de alinhamento com cliente',
          description: 'Reunião para apresentar estratégias processuais',
          status: 'pending',
          priority: 'medium',
          category: 'client_meeting',
          assigned_lawyer: 'Pedro Advogado',
          client_name: 'Maria Silva',
          matter_title: 'Consultoria Empresarial',
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          start_time: '10:00',
          estimated_hours: 1,
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      setTasks(sampleTasks)
      calculateStats(sampleTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (tasksData: Task[]) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    const stats = {
      totalTasks: tasksData.length,
      pendingTasks: tasksData.filter(t => t.status === 'pending').length,
      inProgress: tasksData.filter(t => t.status === 'in_progress').length,
      completedToday: tasksData.filter(t => 
        t.status === 'completed' && 
        t.completed_at?.split('T')[0] === today
      ).length,
      overdueTasks: tasksData.filter(t => 
        t.status !== 'completed' && 
        t.due_date && 
        new Date(t.due_date) < now
      ).length,
      highPriorityTasks: tasksData.filter(t => 
        ['high', 'critical'].includes(t.priority) && 
        t.status !== 'completed'
      ).length
    }
    setStats(stats)
  }

  const filterTasks = () => {
    let filtered = tasks

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.matter_title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    setFilteredTasks(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
      cancelled: 'Cancelada'
    }

    const statusIcons = {
      pending: ClockIcon,
      in_progress: PlayIcon,
      completed: CheckCircleIcon,
      cancelled: XMarkIcon
    }

    const Icon = statusIcons[status as keyof typeof statusIcons] || ClockIcon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityStyles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }

    const priorityLabels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${priorityStyles[priority as keyof typeof priorityStyles] || 'bg-gray-100 text-gray-800'}`}>
        <FlagIcon className="w-3 h-3 mr-1" />
        {priorityLabels[priority as keyof typeof priorityLabels] || priority}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  const isOverdue = (task: Task) => {
    return task.status !== 'completed' && task.due_date && new Date(task.due_date) < new Date()
  }

  const handleCreateTask = () => {
    setSelectedTask(null)
    setShowTaskModal(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const handleStatusChange = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: newStatus as Task['status'],
            updated_at: new Date().toISOString(),
            completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
          }
        : task
    ))
  }

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
            <p className="text-gray-600">Você não tem permissão para acessar as tarefas internas.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
          <p className="mt-2 text-gray-600">
            Gerencie tarefas e atividades do escritório
          </p>
        </div>
        <button
          onClick={handleCreateTask}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Nova Tarefa
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendentes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.pendingTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlayIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Em Andamento
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.inProgress}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Hoje
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.completedToday}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Atrasadas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.overdueTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FlagIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Alta Prioridade
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.highPriorityTasks}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Buscar por título, descrição, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
              Filtros
              <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700">
                    Prioridade
                  </label>
                  <select
                    id="priority-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || statusFilter || priorityFilter) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('')
                      setPriorityFilter('')
                    }}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Limpar todos os filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-700">
        Mostrando {filteredTasks.length} de {tasks.length} tarefas
      </div>

      {/* Tasks List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredTasks.map((task) => (
            <li key={task.id}>
              <div className={`px-4 py-4 sm:px-6 hover:bg-gray-50 ${isOverdue(task) ? 'border-l-4 border-red-500 bg-red-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-medium text-gray-900 truncate">
                            {task.title}
                          </p>
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                          {isOverdue(task) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                              ATRASADA
                            </span>
                          )}
                        </div>
                        
                        {task.description && (
                          <div className="mt-1 text-sm text-gray-700">
                            {task.description}
                          </div>
                        )}
                        
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                          {task.client_name && (
                            <span className="flex items-center">
                              <UserIcon className="w-4 h-4 mr-1" />
                              {task.client_name}
                            </span>
                          )}
                          {task.matter_title && (
                            <span>Caso: {task.matter_title}</span>
                          )}
                          {task.assigned_lawyer && (
                            <span>Atribuído: {task.assigned_lawyer}</span>
                          )}
                          <span>Categoria: {categoryOptions.find(c => c.value === task.category)?.label}</span>
                        </div>
                        
                        <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                          {task.due_date && (
                            <span className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              Prazo: {formatDate(task.due_date)}
                              {task.start_time && ` às ${formatTime(task.start_time)}`}
                            </span>
                          )}
                          {task.estimated_hours && (
                            <span>Estimado: {task.estimated_hours}h</span>
                          )}
                          {task.actual_hours && (
                            <span>Realizado: {task.actual_hours}h</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-5 flex-shrink-0 flex items-center space-x-2">
                    {/* Quick Status Change */}
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="completed">Concluída</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                    
                    <button
                      onClick={() => handleEditTask(task)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => console.log('Delete task:', task.id)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma tarefa encontrada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter || priorityFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando uma nova tarefa.'}
            </p>
            {!searchTerm && !statusFilter && !priorityFilter && (
              <div className="mt-6">
                <button
                  onClick={handleCreateTask}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Nova Tarefa
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              
              // TODO: Implement actual task creation/update
              console.log('Task data:', Object.fromEntries(formData))
              alert(selectedTask ? 'Tarefa atualizada!' : 'Tarefa criada!')
              setShowTaskModal(false)
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={selectedTask?.title}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Ex: Preparar petição inicial..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    defaultValue={selectedTask?.description}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Detalhes da tarefa..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={selectedTask?.status || 'pending'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="pending">Pendente</option>
                      <option value="in_progress">Em Andamento</option>
                      <option value="completed">Concluída</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      name="priority"
                      defaultValue={selectedTask?.priority || 'medium'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="critical">Crítica</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    name="category"
                    defaultValue={selectedTask?.category || 'other'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data de Vencimento
                    </label>
                    <input
                      type="date"
                      name="due_date"
                      defaultValue={selectedTask?.due_date?.split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de Início
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      defaultValue={selectedTask?.start_time}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horas Estimadas
                    </label>
                    <input
                      type="number"
                      name="estimated_hours"
                      defaultValue={selectedTask?.estimated_hours}
                      min="0"
                      step="0.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Ex: 2.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Atribuído a
                    </label>
                    <input
                      type="text"
                      name="assigned_lawyer"
                      defaultValue={selectedTask?.assigned_lawyer}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nome do advogado"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                  >
                    {selectedTask ? 'Atualizar' : 'Criar'} Tarefa
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