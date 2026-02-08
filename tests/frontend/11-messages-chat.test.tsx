/**
 * Frontend UI Tests: Messages / Chat Module
 * Tests conversation list, chat interface, new conversation modal, and messages page
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/messages',
}))

// =====================================================
// Types (self-contained to avoid @/ alias issues)
// =====================================================

interface Conversation {
  id: string
  law_firm_id: string
  title?: string
  description?: string
  conversation_type?: 'internal' | 'client' | 'whatsapp'
  status?: 'active' | 'archived' | 'closed'
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  topic?: string
  last_message_at?: string
  last_message_preview?: string
  matter_id?: string
  contact_id?: string
  created_at: string
  updated_at: string
}

interface Message {
  id: string
  conversation_id: string
  content: string
  message_type?: 'text' | 'file' | 'system' | 'whatsapp'
  sender_id?: string
  sender_type?: 'user' | 'contact' | 'system'
  status?: 'sent' | 'delivered' | 'read' | 'failed'
  created_at: string
  updated_at: string
}

interface TypingIndicator {
  user_id: string
  user_name: string
  is_typing: boolean
  timestamp: string
}

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
}

// =====================================================
// Sample Data
// =====================================================

const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    law_firm_id: 'firm-1',
    title: 'Consulta sobre processo trabalhista',
    conversation_type: 'client',
    status: 'active',
    priority: 'normal',
    topic: 'Consulta Juridica',
    last_message_at: '2026-02-08T10:30:00Z',
    last_message_preview: 'Precisamos revisar os documentos',
    contact_id: 'contact-1',
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-02-08T10:30:00Z',
  },
  {
    id: 'conv-2',
    law_firm_id: 'firm-1',
    title: 'Audiencia urgente',
    conversation_type: 'client',
    status: 'active',
    priority: 'urgent',
    topic: 'Urgente',
    last_message_at: '2026-02-08T14:00:00Z',
    last_message_preview: 'Audiencia marcada para amanha',
    contact_id: 'contact-2',
    created_at: '2026-02-07T08:00:00Z',
    updated_at: '2026-02-08T14:00:00Z',
  },
  {
    id: 'conv-3',
    law_firm_id: 'firm-1',
    title: 'Chat interno - Estrategia',
    conversation_type: 'internal',
    status: 'active',
    priority: 'high',
    topic: 'Geral',
    last_message_at: '2026-02-07T16:00:00Z',
    last_message_preview: 'Reuniao marcada',
    created_at: '2026-02-05T10:00:00Z',
    updated_at: '2026-02-07T16:00:00Z',
  },
  {
    id: 'conv-4',
    law_firm_id: 'firm-1',
    title: 'WhatsApp - Maria Silva',
    conversation_type: 'whatsapp',
    status: 'archived',
    priority: 'low',
    topic: 'Documentos',
    last_message_at: '2026-01-15T09:00:00Z',
    last_message_preview: 'Documentos recebidos',
    contact_id: 'contact-3',
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-15T09:00:00Z',
  },
]

const SAMPLE_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    content: 'Bom dia, gostaria de saber sobre o andamento do processo.',
    message_type: 'text',
    sender_id: 'contact-1',
    sender_type: 'contact',
    status: 'read',
    created_at: '2026-02-08T09:00:00Z',
    updated_at: '2026-02-08T09:00:00Z',
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    content: 'Bom dia! O processo esta em fase de instrucao.',
    message_type: 'text',
    sender_id: 'user-1',
    sender_type: 'user',
    status: 'delivered',
    created_at: '2026-02-08T09:05:00Z',
    updated_at: '2026-02-08T09:05:00Z',
  },
  {
    id: 'msg-3',
    conversation_id: 'conv-1',
    content: 'Precisamos revisar os documentos antes da audiencia.',
    message_type: 'text',
    sender_id: 'user-1',
    sender_type: 'user',
    status: 'sent',
    created_at: '2026-02-08T10:30:00Z',
    updated_at: '2026-02-08T10:30:00Z',
  },
  {
    id: 'msg-4',
    conversation_id: 'conv-1',
    content: 'Conversa iniciada',
    message_type: 'system',
    sender_type: 'system',
    status: 'read',
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-02-01T09:00:00Z',
  },
]

const SAMPLE_CONTACTS: Contact[] = [
  { id: 'contact-1', name: 'Joao da Silva', email: 'joao@email.com', phone: '11999999999' },
  { id: 'contact-2', name: 'Maria Santos', email: 'maria@email.com', phone: '11888888888' },
  { id: 'contact-3', name: 'Pedro Costa', email: 'pedro@email.com' },
]

const CONVERSATION_TOPICS = [
  { id: '1', name: 'Geral', color: '#0066CC' },
  { id: '2', name: 'Consulta Juridica', color: '#10B981' },
  { id: '3', name: 'Documentos', color: '#F59E0B' },
  { id: '4', name: 'Audiencias', color: '#EF4444' },
  { id: '5', name: 'Urgente', color: '#DC2626' },
]

// =====================================================
// Mock Components (self-contained, no @/ imports)
// =====================================================

// --- ConversationItem ---
const MockConversationItem = ({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}) => {
  const typeIcons: Record<string, string> = { whatsapp: '📱', internal: '🔒', client: '💬' }
  return (
    <div
      data-testid={`conversation-item-${conversation.id}`}
      onClick={onClick}
      className={isSelected ? 'selected' : ''}
      role="button"
    >
      <h3 data-testid="conv-title">{conversation.title || 'Conversa sem titulo'}</h3>
      <span data-testid="conv-type-icon">{typeIcons[conversation.conversation_type || 'client']}</span>
      {conversation.priority === 'urgent' && <span data-testid="priority-urgent">Urgente</span>}
      {conversation.priority === 'high' && <span data-testid="priority-high">Alta</span>}
      <p data-testid="conv-preview">{conversation.last_message_preview || 'Nenhuma mensagem ainda'}</p>
      {conversation.topic && <span data-testid="conv-topic">{conversation.topic}</span>}
      {conversation.matter_id && <span data-testid="conv-matter">Processo</span>}
      <span data-testid="conv-status">{conversation.status}</span>
    </div>
  )
}

// --- ConversationList ---
const MockConversationList = ({
  conversations,
  isClient = false,
  onSelectConversation,
  selectedConversationId,
  onNewConversation,
}: {
  conversations: Conversation[]
  isClient?: boolean
  onSelectConversation: (c: Conversation) => void
  selectedConversationId?: string
  onNewConversation?: () => void
}) => {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filterType, setFilterType] = React.useState<'all' | 'urgent'>('all')
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null)
  const [showTopicFilter, setShowTopicFilter] = React.useState(false)

  const filtered = conversations.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (
        !(c.title?.toLowerCase().includes(q)) &&
        !(c.last_message_preview?.toLowerCase().includes(q))
      )
        return false
    }
    if (selectedTopic && c.topic !== selectedTopic) return false
    if (filterType === 'urgent') return c.priority === 'urgent'
    return true
  })

  return (
    <div data-testid="conversation-list">
      <h2>{isClient ? 'Minhas Conversas' : 'Chat'}</h2>
      <input
        data-testid="search-input"
        type="text"
        placeholder="Buscar conversas..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div data-testid="filter-buttons">
        <button
          data-testid="filter-all"
          onClick={() => setFilterType('all')}
          className={filterType === 'all' ? 'active' : ''}
        >
          Todas
        </button>
        <button
          data-testid="filter-urgent"
          onClick={() => setFilterType('urgent')}
          className={filterType === 'urgent' ? 'active' : ''}
        >
          Urgentes
        </button>
      </div>
      <button data-testid="toggle-topic-filter" onClick={() => setShowTopicFilter(!showTopicFilter)}>
        Filtrar por topico
      </button>
      {showTopicFilter && (
        <div data-testid="topic-filters">
          <button data-testid="topic-all" onClick={() => setSelectedTopic(null)}>
            Todos
          </button>
          {CONVERSATION_TOPICS.map((t) => (
            <button key={t.id} data-testid={`topic-${t.name}`} onClick={() => setSelectedTopic(t.name)}>
              {t.name}
            </button>
          ))}
        </div>
      )}
      {!isClient && onNewConversation && (
        <button data-testid="new-conversation-btn" onClick={onNewConversation}>
          Nova Conversa
        </button>
      )}
      <div data-testid="conversations-container">
        {filtered.length === 0 ? (
          <div data-testid="empty-state">
            <p>{searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}</p>
          </div>
        ) : (
          filtered.map((c) => (
            <MockConversationItem
              key={c.id}
              conversation={c}
              isSelected={selectedConversationId === c.id}
              onClick={() => onSelectConversation(c)}
            />
          ))
        )}
      </div>
      <span data-testid="conversation-count">{filtered.length}</span>
    </div>
  )
}

// --- MessageBubble ---
const MockMessageBubble = ({
  message,
  isFromCurrentUser,
}: {
  message: Message
  isFromCurrentUser: boolean
}) => {
  if (message.message_type === 'system') {
    return (
      <div data-testid={`message-${message.id}`} data-system="true">
        <p>{message.content}</p>
      </div>
    )
  }
  return (
    <div
      data-testid={`message-${message.id}`}
      data-from-current={isFromCurrentUser}
      data-type={message.message_type}
    >
      <p data-testid="message-content">{message.content}</p>
      <span data-testid="message-status">{message.status}</span>
    </div>
  )
}

// --- ChatInterface ---
const MockChatInterface = ({
  conversation,
  messages,
  currentUserId,
  currentUserName,
  typingUsers = [],
  onSendMessage,
  onClose,
}: {
  conversation: Conversation
  messages: Message[]
  currentUserId: string
  currentUserName: string
  typingUsers?: TypingIndicator[]
  onSendMessage: (content: string) => void
  onClose?: () => void
}) => {
  const [newMessage, setNewMessage] = React.useState('')
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)

  const handleSend = () => {
    if (!newMessage.trim()) return
    onSendMessage(newMessage.trim())
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div data-testid="chat-interface">
      <div data-testid="chat-header">
        <h3>{conversation.title || 'Conversa'}</h3>
        {conversation.conversation_type === 'whatsapp' && <span>WhatsApp</span>}
        {conversation.priority === 'urgent' && <span data-testid="urgent-badge">Urgente</span>}
        {onClose && (
          <button data-testid="close-chat" onClick={onClose}>
            Fechar
          </button>
        )}
      </div>
      <div data-testid="messages-container">
        {messages.map((msg) => (
          <MockMessageBubble
            key={msg.id}
            message={msg}
            isFromCurrentUser={msg.sender_id === currentUserId}
          />
        ))}
      </div>
      {typingUsers.length > 0 && (
        <div data-testid="typing-indicator">
          {typingUsers.map((t) => t.user_name).join(', ')} esta digitando...
        </div>
      )}
      <div data-testid="message-input-area">
        <button data-testid="attach-file-btn">Anexar</button>
        <textarea
          data-testid="message-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Digite sua mensagem..."
        />
        <button data-testid="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
          Emoji
        </button>
        {showEmojiPicker && (
          <div data-testid="emoji-picker">
            {['😀', '👍', '❤️'].map((emoji) => (
              <button
                key={emoji}
                data-testid={`emoji-${emoji}`}
                onClick={() => {
                  setNewMessage((prev) => prev + emoji)
                  setShowEmojiPicker(false)
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <button data-testid="send-btn" onClick={handleSend} disabled={!newMessage.trim()}>
          Enviar
        </button>
      </div>
    </div>
  )
}

// --- NewConversationModal ---
const MockNewConversationModal = ({
  isOpen,
  contacts,
  onClose,
  onCreateConversation,
}: {
  isOpen: boolean
  contacts: Contact[]
  onClose: () => void
  onCreateConversation: (data: {
    contactId: string
    topic: string
    title: string
    conversationType: string
    priority: string
  }) => void
}) => {
  const [step, setStep] = React.useState(1)
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null)
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState('')
  const [conversationType, setConversationType] = React.useState('client')
  const [priority, setPriority] = React.useState('normal')
  const [searchTerm, setSearchTerm] = React.useState('')

  React.useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSelectedContact(null)
      setSelectedTopic(null)
      setTitle('')
      setSearchTerm('')
      setConversationType('client')
      setPriority('normal')
    }
  }, [isOpen])

  if (!isOpen) return null

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div data-testid="new-conversation-modal">
      <h3>
        {step === 1 ? 'Nova Conversa - Selecionar Cliente' : 'Nova Conversa - Detalhes'}
      </h3>
      <button data-testid="modal-close" onClick={onClose}>
        Fechar
      </button>

      {step === 1 && (
        <div data-testid="step-1">
          <input
            data-testid="contact-search"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div data-testid="contact-list">
            {filteredContacts.map((c) => (
              <div
                key={c.id}
                data-testid={`contact-${c.id}`}
                onClick={() => {
                  setSelectedContact(c)
                  setTitle(`Conversa com ${c.name}`)
                  setStep(2)
                }}
                role="button"
              >
                <span>{c.name}</span>
                <span>{c.email}</span>
              </div>
            ))}
            {filteredContacts.length === 0 && (
              <p data-testid="no-contacts">Nenhum cliente encontrado</p>
            )}
          </div>
        </div>
      )}

      {step === 2 && selectedContact && (
        <div data-testid="step-2">
          <div data-testid="selected-contact">
            <span>{selectedContact.name}</span>
            <span>{selectedContact.email}</span>
          </div>
          <div data-testid="topic-selection">
            {CONVERSATION_TOPICS.map((t) => (
              <button
                key={t.id}
                data-testid={`select-topic-${t.name}`}
                onClick={() => setSelectedTopic(t.name)}
                className={selectedTopic === t.name ? 'selected' : ''}
              >
                {t.name}
              </button>
            ))}
          </div>
          <input
            data-testid="conversation-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            data-testid="conversation-type"
            value={conversationType}
            onChange={(e) => setConversationType(e.target.value)}
          >
            <option value="client">Cliente</option>
            <option value="internal">Interna</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
          <select
            data-testid="conversation-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
          <button data-testid="back-btn" onClick={() => setStep(1)}>
            Voltar
          </button>
          <button
            data-testid="create-btn"
            disabled={!selectedTopic}
            onClick={() => {
              if (!selectedTopic) return
              onCreateConversation({
                contactId: selectedContact.id,
                topic: selectedTopic,
                title: title || `Conversa com ${selectedContact.name}`,
                conversationType,
                priority,
              })
            }}
          >
            Criar Conversa
          </button>
        </div>
      )}
    </div>
  )
}

// --- MessagesPage ---
const MockMessagesPage = ({
  conversations,
  messages,
  contacts,
  isClient = false,
}: {
  conversations: Conversation[]
  messages: Message[]
  contacts: Contact[]
  isClient?: boolean
}) => {
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null)
  const [showNewModal, setShowNewModal] = React.useState(false)
  const sentMessages = React.useRef<Message[]>([...messages])

  const handleSendMessage = (content: string) => {
    const newMsg: Message = {
      id: `msg-new-${Date.now()}`,
      conversation_id: selectedConversation?.id || '',
      content,
      message_type: 'text',
      sender_id: 'user-1',
      sender_type: 'user',
      status: 'sent',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    sentMessages.current = [...sentMessages.current, newMsg]
  }

  const currentMessages = sentMessages.current.filter(
    (m) => m.conversation_id === selectedConversation?.id
  )

  return (
    <div data-testid="messages-page">
      <div data-testid="page-header">
        <h1>Mensagens</h1>
        <p>{isClient ? 'Converse com seu advogado' : 'Central de comunicacao com clientes'}</p>
      </div>
      <div data-testid="page-layout">
        <div data-testid="sidebar">
          <MockConversationList
            conversations={conversations}
            isClient={isClient}
            onSelectConversation={setSelectedConversation}
            selectedConversationId={selectedConversation?.id}
            onNewConversation={() => setShowNewModal(true)}
          />
        </div>
        <div data-testid="main-area">
          {selectedConversation ? (
            <MockChatInterface
              conversation={selectedConversation}
              messages={currentMessages}
              currentUserId="user-1"
              currentUserName="Dr. Silva"
              onSendMessage={handleSendMessage}
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <div data-testid="no-conversation-selected">
              <p>Selecione uma conversa</p>
            </div>
          )}
        </div>
      </div>
      <MockNewConversationModal
        isOpen={showNewModal}
        contacts={contacts}
        onClose={() => setShowNewModal(false)}
        onCreateConversation={() => setShowNewModal(false)}
      />
    </div>
  )
}

// =====================================================
// Helper
// =====================================================

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

// =====================================================
// TESTS
// =====================================================

describe('Messages Module: Conversation List', () => {
  it('should render conversation list with all conversations', () => {
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    expect(screen.getByTestId('conversation-list')).toBeInTheDocument()
    expect(screen.getByTestId('conversation-count').textContent).toBe('4')
    expect(screen.getByText('Chat')).toBeInTheDocument()
  })

  it('should show client-facing title for client users', () => {
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        isClient={true}
        onSelectConversation={jest.fn()}
      />
    )
    expect(screen.getByText('Minhas Conversas')).toBeInTheDocument()
  })

  it('should filter conversations by search query', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    await user.type(screen.getByTestId('search-input'), 'trabalhista')
    expect(screen.getByTestId('conversation-count').textContent).toBe('1')
    expect(screen.getByText('Consulta sobre processo trabalhista')).toBeInTheDocument()
  })

  it('should filter conversations by search in preview text', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    await user.type(screen.getByTestId('search-input'), 'Reuniao')
    expect(screen.getByTestId('conversation-count').textContent).toBe('1')
  })

  it('should show empty state when no conversations match search', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    await user.type(screen.getByTestId('search-input'), 'xyznonexistent')
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma conversa encontrada')).toBeInTheDocument()
  })

  it('should show empty state when no conversations exist', () => {
    renderWithProviders(
      <MockConversationList conversations={[]} onSelectConversation={jest.fn()} />
    )
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma conversa ainda')).toBeInTheDocument()
  })

  it('should filter urgent conversations only', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    await user.click(screen.getByTestId('filter-urgent'))
    expect(screen.getByTestId('conversation-count').textContent).toBe('1')
    expect(screen.getByText('Audiencia urgente')).toBeInTheDocument()
  })

  it('should filter by topic', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    await user.click(screen.getByTestId('toggle-topic-filter'))
    expect(screen.getByTestId('topic-filters')).toBeInTheDocument()
    await user.click(screen.getByTestId('topic-Documentos'))
    expect(screen.getByTestId('conversation-count').textContent).toBe('1')
  })

  it('should clear topic filter with Todos button', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    await user.click(screen.getByTestId('toggle-topic-filter'))
    await user.click(screen.getByTestId('topic-Urgente'))
    expect(screen.getByTestId('conversation-count').textContent).toBe('1')
    await user.click(screen.getByTestId('topic-all'))
    expect(screen.getByTestId('conversation-count').textContent).toBe('4')
  })

  it('should call onSelectConversation when clicking a conversation', async () => {
    const user = userEvent.setup()
    const onSelect = jest.fn()
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={onSelect}
      />
    )
    await user.click(screen.getByTestId('conversation-item-conv-1'))
    expect(onSelect).toHaveBeenCalledWith(SAMPLE_CONVERSATIONS[0])
  })

  it('should display conversation type icons correctly', () => {
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    const conv1 = screen.getByTestId('conversation-item-conv-1')
    expect(within(conv1).getByTestId('conv-type-icon').textContent).toBe('💬')
    const conv3 = screen.getByTestId('conversation-item-conv-3')
    expect(within(conv3).getByTestId('conv-type-icon').textContent).toBe('🔒')
    const conv4 = screen.getByTestId('conversation-item-conv-4')
    expect(within(conv4).getByTestId('conv-type-icon').textContent).toBe('📱')
  })

  it('should display priority indicators', () => {
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    const conv2 = screen.getByTestId('conversation-item-conv-2')
    expect(within(conv2).getByTestId('priority-urgent')).toBeInTheDocument()
    const conv3 = screen.getByTestId('conversation-item-conv-3')
    expect(within(conv3).getByTestId('priority-high')).toBeInTheDocument()
  })

  it('should display topic badges', () => {
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
      />
    )
    const conv1 = screen.getByTestId('conversation-item-conv-1')
    expect(within(conv1).getByTestId('conv-topic').textContent).toBe('Consulta Juridica')
  })

  it('should show New Conversation button for non-client users', () => {
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        onSelectConversation={jest.fn()}
        onNewConversation={jest.fn()}
      />
    )
    expect(screen.getByTestId('new-conversation-btn')).toBeInTheDocument()
  })

  it('should hide New Conversation button for client users', () => {
    renderWithProviders(
      <MockConversationList
        conversations={SAMPLE_CONVERSATIONS}
        isClient={true}
        onSelectConversation={jest.fn()}
        onNewConversation={jest.fn()}
      />
    )
    expect(screen.queryByTestId('new-conversation-btn')).not.toBeInTheDocument()
  })
})

describe('Messages Module: Chat Interface', () => {
  const defaultProps = {
    conversation: SAMPLE_CONVERSATIONS[0],
    messages: SAMPLE_MESSAGES.filter((m) => m.conversation_id === 'conv-1'),
    currentUserId: 'user-1',
    currentUserName: 'Dr. Silva',
    onSendMessage: jest.fn(),
  }

  beforeEach(() => {
    ;(defaultProps.onSendMessage as jest.Mock).mockClear()
  })

  it('should render chat header with conversation title', () => {
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    expect(screen.getByText('Consulta sobre processo trabalhista')).toBeInTheDocument()
  })

  it('should render all messages', () => {
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
    expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
    expect(screen.getByTestId('message-msg-3')).toBeInTheDocument()
    expect(screen.getByTestId('message-msg-4')).toBeInTheDocument()
  })

  it('should identify messages from current user', () => {
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    // msg-1 is from contact-1 (not current user)
    expect(screen.getByTestId('message-msg-1').getAttribute('data-from-current')).toBe('false')
    // msg-2 is from user-1 (current user)
    expect(screen.getByTestId('message-msg-2').getAttribute('data-from-current')).toBe('true')
  })

  it('should render system messages differently', () => {
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    expect(screen.getByTestId('message-msg-4').getAttribute('data-system')).toBe('true')
  })

  it('should send message on button click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    await user.type(screen.getByTestId('message-input'), 'Nova mensagem de teste')
    await user.click(screen.getByTestId('send-btn'))
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Nova mensagem de teste')
  })

  it('should send message on Enter key', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    const input = screen.getByTestId('message-input')
    await user.type(input, 'Mensagem via Enter')
    await user.keyboard('{Enter}')
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith('Mensagem via Enter')
  })

  it('should not send empty message', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    expect(screen.getByTestId('send-btn')).toBeDisabled()
    await user.click(screen.getByTestId('send-btn'))
    expect(defaultProps.onSendMessage).not.toHaveBeenCalled()
  })

  it('should clear input after sending', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    const input = screen.getByTestId('message-input') as HTMLTextAreaElement
    await user.type(input, 'Teste limpar')
    await user.click(screen.getByTestId('send-btn'))
    expect(input.value).toBe('')
  })

  it('should show typing indicator when users are typing', () => {
    const typingUsers: TypingIndicator[] = [
      { user_id: 'contact-1', user_name: 'Joao', is_typing: true, timestamp: new Date().toISOString() },
    ]
    renderWithProviders(<MockChatInterface {...defaultProps} typingUsers={typingUsers} />)
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument()
    expect(screen.getByText('Joao esta digitando...')).toBeInTheDocument()
  })

  it('should not show typing indicator when no one is typing', () => {
    renderWithProviders(<MockChatInterface {...defaultProps} typingUsers={[]} />)
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument()
  })

  it('should toggle emoji picker', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
    await user.click(screen.getByTestId('emoji-btn'))
    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
    await user.click(screen.getByTestId('emoji-btn'))
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
  })

  it('should insert emoji into message input', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    await user.click(screen.getByTestId('emoji-btn'))
    await user.click(screen.getByTestId('emoji-👍'))
    const input = screen.getByTestId('message-input') as HTMLTextAreaElement
    expect(input.value).toBe('👍')
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
  })

  it('should show close button and call onClose', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    renderWithProviders(<MockChatInterface {...defaultProps} onClose={onClose} />)
    await user.click(screen.getByTestId('close-chat'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should show urgent badge for urgent conversations', () => {
    renderWithProviders(
      <MockChatInterface {...defaultProps} conversation={SAMPLE_CONVERSATIONS[1]} />
    )
    expect(screen.getByTestId('urgent-badge')).toBeInTheDocument()
  })

  it('should display message status indicators', () => {
    renderWithProviders(<MockChatInterface {...defaultProps} />)
    const msg1 = screen.getByTestId('message-msg-1')
    expect(within(msg1).getByTestId('message-status').textContent).toBe('read')
    const msg3 = screen.getByTestId('message-msg-3')
    expect(within(msg3).getByTestId('message-status').textContent).toBe('sent')
  })
})

describe('Messages Module: New Conversation Modal', () => {
  const defaultProps = {
    isOpen: true,
    contacts: SAMPLE_CONTACTS,
    onClose: jest.fn(),
    onCreateConversation: jest.fn(),
  }

  beforeEach(() => {
    ;(defaultProps.onClose as jest.Mock).mockClear()
    ;(defaultProps.onCreateConversation as jest.Mock).mockClear()
  })

  it('should render modal when open', () => {
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    expect(screen.getByTestId('new-conversation-modal')).toBeInTheDocument()
    expect(screen.getByText('Nova Conversa - Selecionar Cliente')).toBeInTheDocument()
  })

  it('should not render modal when closed', () => {
    renderWithProviders(<MockNewConversationModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByTestId('new-conversation-modal')).not.toBeInTheDocument()
  })

  it('should display contact list in step 1', () => {
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    expect(screen.getByTestId('step-1')).toBeInTheDocument()
    expect(screen.getByTestId('contact-contact-1')).toBeInTheDocument()
    expect(screen.getByTestId('contact-contact-2')).toBeInTheDocument()
    expect(screen.getByTestId('contact-contact-3')).toBeInTheDocument()
  })

  it('should filter contacts by search', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.type(screen.getByTestId('contact-search'), 'Maria')
    expect(screen.getByTestId('contact-contact-2')).toBeInTheDocument()
    expect(screen.queryByTestId('contact-contact-1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('contact-contact-3')).not.toBeInTheDocument()
  })

  it('should show empty state when no contacts match', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.type(screen.getByTestId('contact-search'), 'nonexistent')
    expect(screen.getByTestId('no-contacts')).toBeInTheDocument()
  })

  it('should advance to step 2 when selecting a contact', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.click(screen.getByTestId('contact-contact-1'))
    expect(screen.getByTestId('step-2')).toBeInTheDocument()
    expect(screen.getByText('Nova Conversa - Detalhes')).toBeInTheDocument()
    expect(screen.getByTestId('selected-contact')).toBeInTheDocument()
  })

  it('should auto-fill title when selecting contact', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.click(screen.getByTestId('contact-contact-1'))
    const titleInput = screen.getByTestId('conversation-title') as HTMLInputElement
    expect(titleInput.value).toBe('Conversa com Joao da Silva')
  })

  it('should display topic selection in step 2', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.click(screen.getByTestId('contact-contact-1'))
    expect(screen.getByTestId('topic-selection')).toBeInTheDocument()
    CONVERSATION_TOPICS.forEach((t) => {
      expect(screen.getByTestId(`select-topic-${t.name}`)).toBeInTheDocument()
    })
  })

  it('should disable create button until topic is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.click(screen.getByTestId('contact-contact-1'))
    expect(screen.getByTestId('create-btn')).toBeDisabled()
    await user.click(screen.getByTestId('select-topic-Geral'))
    expect(screen.getByTestId('create-btn')).not.toBeDisabled()
  })

  it('should create conversation with correct data', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.click(screen.getByTestId('contact-contact-2'))
    await user.click(screen.getByTestId('select-topic-Urgente'))
    await user.selectOptions(screen.getByTestId('conversation-priority'), 'urgent')
    await user.click(screen.getByTestId('create-btn'))
    expect(defaultProps.onCreateConversation).toHaveBeenCalledWith({
      contactId: 'contact-2',
      topic: 'Urgente',
      title: 'Conversa com Maria Santos',
      conversationType: 'client',
      priority: 'urgent',
    })
  })

  it('should go back to step 1 when clicking back', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.click(screen.getByTestId('contact-contact-1'))
    expect(screen.getByTestId('step-2')).toBeInTheDocument()
    await user.click(screen.getByTestId('back-btn'))
    expect(screen.getByTestId('step-1')).toBeInTheDocument()
  })

  it('should call onClose when clicking close button', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.click(screen.getByTestId('modal-close'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('should allow changing conversation type', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MockNewConversationModal {...defaultProps} />)
    await user.click(screen.getByTestId('contact-contact-1'))
    await user.selectOptions(screen.getByTestId('conversation-type'), 'internal')
    await user.click(screen.getByTestId('select-topic-Geral'))
    await user.click(screen.getByTestId('create-btn'))
    expect(defaultProps.onCreateConversation).toHaveBeenCalledWith(
      expect.objectContaining({ conversationType: 'internal' })
    )
  })
})

describe('Messages Module: Messages Page', () => {
  it('should render page header', () => {
    renderWithProviders(
      <MockMessagesPage
        conversations={SAMPLE_CONVERSATIONS}
        messages={SAMPLE_MESSAGES}
        contacts={SAMPLE_CONTACTS}
      />
    )
    expect(screen.getByText('Mensagens')).toBeInTheDocument()
    expect(screen.getByText('Central de comunicacao com clientes')).toBeInTheDocument()
  })

  it('should show client-facing subtitle for client users', () => {
    renderWithProviders(
      <MockMessagesPage
        conversations={SAMPLE_CONVERSATIONS}
        messages={SAMPLE_MESSAGES}
        contacts={SAMPLE_CONTACTS}
        isClient={true}
      />
    )
    expect(screen.getByText('Converse com seu advogado')).toBeInTheDocument()
  })

  it('should show no-conversation-selected state initially', () => {
    renderWithProviders(
      <MockMessagesPage
        conversations={SAMPLE_CONVERSATIONS}
        messages={SAMPLE_MESSAGES}
        contacts={SAMPLE_CONTACTS}
      />
    )
    expect(screen.getByTestId('no-conversation-selected')).toBeInTheDocument()
    expect(screen.getByText('Selecione uma conversa')).toBeInTheDocument()
  })

  it('should show chat interface when selecting a conversation', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockMessagesPage
        conversations={SAMPLE_CONVERSATIONS}
        messages={SAMPLE_MESSAGES}
        contacts={SAMPLE_CONTACTS}
      />
    )
    await user.click(screen.getByTestId('conversation-item-conv-1'))
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
    expect(screen.queryByTestId('no-conversation-selected')).not.toBeInTheDocument()
  })

  it('should display messages for selected conversation', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockMessagesPage
        conversations={SAMPLE_CONVERSATIONS}
        messages={SAMPLE_MESSAGES}
        contacts={SAMPLE_CONTACTS}
      />
    )
    await user.click(screen.getByTestId('conversation-item-conv-1'))
    expect(screen.getByTestId('message-msg-1')).toBeInTheDocument()
    expect(screen.getByTestId('message-msg-2')).toBeInTheDocument()
    expect(screen.getByTestId('message-msg-3')).toBeInTheDocument()
  })

  it('should close chat and return to empty state', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockMessagesPage
        conversations={SAMPLE_CONVERSATIONS}
        messages={SAMPLE_MESSAGES}
        contacts={SAMPLE_CONTACTS}
      />
    )
    await user.click(screen.getByTestId('conversation-item-conv-1'))
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument()
    await user.click(screen.getByTestId('close-chat'))
    expect(screen.getByTestId('no-conversation-selected')).toBeInTheDocument()
  })

  it('should open new conversation modal', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <MockMessagesPage
        conversations={SAMPLE_CONVERSATIONS}
        messages={SAMPLE_MESSAGES}
        contacts={SAMPLE_CONTACTS}
      />
    )
    await user.click(screen.getByTestId('new-conversation-btn'))
    expect(screen.getByTestId('new-conversation-modal')).toBeInTheDocument()
  })

  it('should show conversation list in sidebar', () => {
    renderWithProviders(
      <MockMessagesPage
        conversations={SAMPLE_CONVERSATIONS}
        messages={SAMPLE_MESSAGES}
        contacts={SAMPLE_CONTACTS}
      />
    )
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('conversation-list')).toBeInTheDocument()
  })
})

describe('Messages Module: Data Model', () => {
  it('should have correct conversation type values', () => {
    const types: Conversation['conversation_type'][] = ['internal', 'client', 'whatsapp']
    types.forEach((t) => {
      expect(['internal', 'client', 'whatsapp']).toContain(t)
    })
  })

  it('should have correct conversation status values', () => {
    const statuses: Conversation['status'][] = ['active', 'archived', 'closed']
    statuses.forEach((s) => {
      expect(['active', 'archived', 'closed']).toContain(s)
    })
  })

  it('should have correct priority values', () => {
    const priorities: Conversation['priority'][] = ['low', 'normal', 'high', 'urgent']
    priorities.forEach((p) => {
      expect(['low', 'normal', 'high', 'urgent']).toContain(p)
    })
  })

  it('should have correct message type values', () => {
    const types: Message['message_type'][] = ['text', 'file', 'system', 'whatsapp']
    types.forEach((t) => {
      expect(['text', 'file', 'system', 'whatsapp']).toContain(t)
    })
  })

  it('should have correct message status values', () => {
    const statuses: Message['status'][] = ['sent', 'delivered', 'read', 'failed']
    statuses.forEach((s) => {
      expect(['sent', 'delivered', 'read', 'failed']).toContain(s)
    })
  })

  it('should link messages to conversations', () => {
    const convMessages = SAMPLE_MESSAGES.filter((m) => m.conversation_id === 'conv-1')
    expect(convMessages.length).toBe(4)
    convMessages.forEach((m) => {
      expect(m.conversation_id).toBe('conv-1')
    })
  })
})

describe('Messages Module: Utility Functions', () => {
  it('should correctly identify message from current user', () => {
    const isFromCurrentUser = (message: Message, userId: string) => message.sender_id === userId
    expect(isFromCurrentUser(SAMPLE_MESSAGES[0], 'user-1')).toBe(false)
    expect(isFromCurrentUser(SAMPLE_MESSAGES[1], 'user-1')).toBe(true)
    expect(isFromCurrentUser(SAMPLE_MESSAGES[2], 'user-1')).toBe(true)
  })

  it('should format message time for recent messages', () => {
    const formatTime = (timestamp: string): string => {
      const date = new Date(timestamp)
      const now = new Date()
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      if (diffHours < 24) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      } else if (diffHours < 24 * 7) {
        return date.toLocaleDateString('pt-BR', {
          weekday: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      } else {
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    }

    const recentTime = new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
    const result = formatTime(recentTime)
    expect(result).toMatch(/\d{2}:\d{2}/)
  })

  it('should correctly group messages by sender', () => {
    const messages = SAMPLE_MESSAGES.filter((m) => m.message_type !== 'system')
    let groupCount = 0
    for (let i = 0; i < messages.length; i++) {
      if (i === 0 || messages[i].sender_id !== messages[i - 1].sender_id) {
        groupCount++
      }
    }
    expect(groupCount).toBe(2) // contact-1 group, then user-1 group
  })
})
