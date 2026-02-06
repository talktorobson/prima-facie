'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  PaymentReminder,
  PaymentCollection,
  ReminderType,
  SendMethod
} from '@/lib/financial/types'
import { 
  Mail,
  MessageSquare,
  Phone,
  FileText,
  Calendar,
  User,
  AlertTriangle,
  Send,
  Clock
} from 'lucide-react'

interface PaymentReminderFormProps {
  collection: PaymentCollection
  initialData?: Partial<PaymentReminder>
  onSubmit: (data: Partial<PaymentReminder>) => void
  onCancel: () => void
  onSchedule: (data: Partial<PaymentReminder>) => void
  isLoading?: boolean
  mode: 'create' | 'edit' | 'schedule'
}

export function PaymentReminderForm({
  collection,
  initialData,
  onSubmit,
  onCancel,
  onSchedule,
  isLoading = false,
  mode
}: PaymentReminderFormProps) {
  const [formData, setFormData] = useState({
    reminder_type: initialData?.reminder_type || getDefaultReminderType(),
    send_method: initialData?.send_method || 'email' as SendMethod,
    scheduled_date: initialData?.scheduled_date || new Date().toISOString().split('T')[0],
    recipient_email: initialData?.recipient_email || collection.client?.email || '',
    recipient_phone: initialData?.recipient_phone || collection.client?.phone || '',
    subject: initialData?.subject || '',
    message_body: initialData?.message_body || '',
    send_immediately: mode === 'create'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Determine default reminder type based on collection status and reminder count
  function getDefaultReminderType(): ReminderType {
    const count = collection.reminder_count || 0
    
    if (count === 0) return 'friendly'
    if (count <= 2) return 'first_overdue'
    if (count <= 4) return 'second_overdue'
    if (count <= 6) return 'final_notice'
    return 'collection_notice'
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.reminder_type) {
      newErrors.reminder_type = 'Tipo de lembrete é obrigatório'
    }

    if (!formData.send_method) {
      newErrors.send_method = 'Método de envio é obrigatório'
    }

    if (formData.send_method === 'email' && !formData.recipient_email) {
      newErrors.recipient_email = 'E-mail do destinatário é obrigatório'
    }

    if (['whatsapp', 'sms', 'phone'].includes(formData.send_method) && !formData.recipient_phone) {
      newErrors.recipient_phone = 'Telefone do destinatário é obrigatório'
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Assunto é obrigatório'
    }

    if (!formData.message_body.trim()) {
      newErrors.message_body = 'Mensagem é obrigatória'
    }

    if (!formData.send_immediately && !formData.scheduled_date) {
      newErrors.scheduled_date = 'Data de agendamento é obrigatória'
    }

    if (formData.scheduled_date && formData.scheduled_date < new Date().toISOString().split('T')[0]) {
      newErrors.scheduled_date = 'Data de agendamento não pode ser no passado'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      const reminderData = {
        ...formData,
        invoice_id: collection.invoice_id,
        client_id: collection.client_id,
        scheduled_date: formData.send_immediately ? new Date().toISOString().split('T')[0] : formData.scheduled_date
      }

      if (formData.send_immediately || mode === 'create') {
        onSubmit(reminderData)
      } else {
        onSchedule(reminderData)
      }
    }
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const generateDefaultSubject = (): string => {
    const clientName = collection.client?.name || 'Cliente'
    const invoiceNumber = collection.invoice?.invoice_number || ''
    const daysOverdue = collection.days_overdue

    switch (formData.reminder_type) {
      case 'friendly':
        return `Lembrete amigável - Fatura ${invoiceNumber}`
      case 'first_overdue':
        return `Fatura em atraso - ${invoiceNumber} (${daysOverdue} dias)`
      case 'second_overdue':
        return `Segundo aviso - Fatura ${invoiceNumber} (${daysOverdue} dias de atraso)`
      case 'final_notice':
        return `AVISO FINAL - Fatura ${invoiceNumber} (${daysOverdue} dias de atraso)`
      case 'collection_notice':
        return `COBRANÇA JUDICIAL - Fatura ${invoiceNumber} será protestada`
      default:
        return `Lembrete de pagamento - Fatura ${invoiceNumber}`
    }
  }

  const generateDefaultMessage = (): string => {
    const clientName = collection.client?.name || 'Cliente'
    const invoiceNumber = collection.invoice?.invoice_number || ''
    const amount = collection.invoice?.balance_due || 0
    const daysOverdue = collection.days_overdue
    const dueDate = collection.invoice?.due_date ? new Date(collection.invoice.due_date).toLocaleDateString('pt-BR') : ''

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }

    switch (formData.reminder_type) {
      case 'friendly':
        return `Prezado(a) ${clientName},

Esperamos que esteja bem. Este é um lembrete amigável sobre a fatura ${invoiceNumber} no valor de ${formatCurrency(amount)}, que venceu em ${dueDate}.

Caso já tenha efetuado o pagamento, por favor desconsidere este lembrete.

Para quaisquer dúvidas, estamos à disposição.

Atenciosamente,
Equipe Financeira`

      case 'first_overdue':
        return `Prezado(a) ${clientName},

Identificamos que a fatura ${invoiceNumber} no valor de ${formatCurrency(amount)} encontra-se em atraso há ${daysOverdue} dias (vencimento: ${dueDate}).

Solicitamos a gentileza de regularizar o pagamento o quanto antes para evitar encargos adicionais.

Caso haja algum problema, entre em contato conosco para buscarmos uma solução.

Atenciosamente,
Equipe Financeira`

      case 'second_overdue':
        return `Prezado(a) ${clientName},

Este é o segundo aviso sobre a fatura ${invoiceNumber} no valor de ${formatCurrency(amount)}, que está em atraso há ${daysOverdue} dias.

É importante regularizar esta situação com urgência para manter seu cadastro em dia e evitar procedimentos de cobrança mais rigorosos.

Estamos disponíveis para negociar formas de pagamento que sejam adequadas à sua situação.

Atenciosamente,
Equipe Financeira`

      case 'final_notice':
        return `Prezado(a) ${clientName},

AVISO FINAL: A fatura ${invoiceNumber} no valor de ${formatCurrency(amount)} está em atraso há ${daysOverdue} dias.

Caso o pagamento não seja efetuado em até 5 (cinco) dias úteis, iniciaremos os procedimentos de cobrança judicial e/ou protesto do título.

Esta é a última oportunidade para regularizar a situação de forma amigável.

Para negociação ou esclarecimentos, entre em contato urgentemente.

Atenciosamente,
Departamento Jurídico`

      case 'collection_notice':
        return `Prezado(a) ${clientName},

NOTIFICAÇÃO DE COBRANÇA JUDICIAL

Informamos que a fatura ${invoiceNumber} no valor de ${formatCurrency(amount)}, em atraso há ${daysOverdue} dias, será encaminhada para protesto e/ou ação judicial de cobrança.

Os procedimentos serão iniciados em 48 horas, caso não haja manifestação de sua parte.

Este é o último aviso antes dos procedimentos legais.

Para evitar maiores transtornos, entre em contato IMEDIATAMENTE.

Departamento Jurídico`

      default:
        return `Prezado(a) ${clientName},

Fatura: ${invoiceNumber}
Valor: ${formatCurrency(amount)}
Vencimento: ${dueDate}
Dias de atraso: ${daysOverdue}

Por favor, regularize o pagamento o quanto antes.

Atenciosamente,
Equipe Financeira`
    }
  }

  const getReminderTypeDescription = (): string => {
    switch (formData.reminder_type) {
      case 'friendly':
        return 'Tom amigável e cordial para clientes em dia'
      case 'first_overdue':
        return 'Primeiro aviso formal de atraso'
      case 'second_overdue':
        return 'Segundo aviso com tom mais firme'
      case 'final_notice':
        return 'Aviso final antes de medidas legais'
      case 'collection_notice':
        return 'Notificação de cobrança judicial'
      default:
        return ''
    }
  }

  const getSendMethodIcon = (method: string) => {
    switch (method) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'phone':
        return <Phone className="h-4 w-4" />
      case 'letter':
        return <FileText className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Enviar Lembrete de Pagamento' : 
             mode === 'schedule' ? 'Agendar Lembrete' : 'Editar Lembrete'}
          </h1>
          <p className="text-gray-600">
            Configure e envie um lembrete de pagamento para o cliente
          </p>
        </div>
      </div>

      {/* Collection Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Cobrança</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Cliente</p>
              <p className="text-lg">{collection.client?.name}</p>
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <User className="h-4 w-4 mr-1" />
                <span>{collection.client?.email || collection.client?.phone}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900">Fatura</p>
              <p className="text-lg">{collection.invoice?.invoice_number}</p>
              <p className="text-sm text-red-600">
                {collection.days_overdue} dias de atraso
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900">Valor</p>
              <p className="text-2xl font-bold">{formatCurrency(collection.invoice?.balance_due || 0)}</p>
              <p className="text-sm text-gray-600">
                Vencimento: {collection.invoice?.due_date ? new Date(collection.invoice.due_date).toLocaleDateString('pt-BR') : ''}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              <strong>Histórico:</strong> {collection.reminder_count} lembretes enviados
              {collection.last_reminder_sent && (
                <span> • Último em {new Date(collection.last_reminder_sent).toLocaleDateString('pt-BR')}</span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reminder Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração do Lembrete</CardTitle>
            <CardDescription>
              Defina o tipo e método de envio do lembrete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reminder_type">Tipo de Lembrete*</Label>
                <Select
                  value={formData.reminder_type}
                  onValueChange={(value) => updateField('reminder_type', value)}
                >
                  <SelectTrigger className={errors.reminder_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Lembrete Amigável</SelectItem>
                    <SelectItem value="first_overdue">Primeiro Aviso</SelectItem>
                    <SelectItem value="second_overdue">Segundo Aviso</SelectItem>
                    <SelectItem value="final_notice">Aviso Final</SelectItem>
                    <SelectItem value="collection_notice">Cobrança Judicial</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">{getReminderTypeDescription()}</p>
                {errors.reminder_type && (
                  <p className="text-sm text-red-600">{errors.reminder_type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="send_method">Método de Envio*</Label>
                <Select
                  value={formData.send_method}
                  onValueChange={(value) => updateField('send_method', value)}
                >
                  <SelectTrigger className={errors.send_method ? 'border-red-500' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>E-mail</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>SMS</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="phone">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>Ligação</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="letter">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Carta</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.send_method && (
                  <p className="text-sm text-red-600">{errors.send_method}</p>
                )}
              </div>
            </div>

            {/* Recipient Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.send_method === 'email' && (
                <div className="space-y-2">
                  <Label htmlFor="recipient_email">E-mail do Destinatário*</Label>
                  <Input
                    id="recipient_email"
                    type="email"
                    value={formData.recipient_email}
                    onChange={(e) => updateField('recipient_email', e.target.value)}
                    className={errors.recipient_email ? 'border-red-500' : ''}
                    placeholder="cliente@email.com"
                  />
                  {errors.recipient_email && (
                    <p className="text-sm text-red-600">{errors.recipient_email}</p>
                  )}
                </div>
              )}

              {['whatsapp', 'sms', 'phone'].includes(formData.send_method) && (
                <div className="space-y-2">
                  <Label htmlFor="recipient_phone">Telefone do Destinatário*</Label>
                  <Input
                    id="recipient_phone"
                    value={formData.recipient_phone}
                    onChange={(e) => updateField('recipient_phone', e.target.value)}
                    className={errors.recipient_phone ? 'border-red-500' : ''}
                    placeholder="(11) 99999-9999"
                  />
                  {errors.recipient_phone && (
                    <p className="text-sm text-red-600">{errors.recipient_phone}</p>
                  )}
                </div>
              )}
            </div>

            {/* Scheduling */}
            {mode !== 'create' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="send_immediately"
                    checked={formData.send_immediately}
                    onChange={(e) => updateField('send_immediately', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <Label htmlFor="send_immediately">Enviar imediatamente</Label>
                </div>

                {!formData.send_immediately && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_date">Data para Envio*</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => updateField('scheduled_date', e.target.value)}
                      className={errors.scheduled_date ? 'border-red-500' : ''}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {errors.scheduled_date && (
                      <p className="text-sm text-red-600">{errors.scheduled_date}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Content */}
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo da Mensagem</CardTitle>
            <CardDescription>
              Personalize o assunto e conteúdo do lembrete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subject">Assunto*</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateField('subject', generateDefaultSubject())}
                >
                  Gerar Automático
                </Button>
              </div>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                className={errors.subject ? 'border-red-500' : ''}
                placeholder="Assunto do lembrete"
              />
              {errors.subject && (
                <p className="text-sm text-red-600">{errors.subject}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message_body">Mensagem*</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateField('message_body', generateDefaultMessage())}
                >
                  Gerar Automático
                </Button>
              </div>
              <Textarea
                id="message_body"
                value={formData.message_body}
                onChange={(e) => updateField('message_body', e.target.value)}
                className={errors.message_body ? 'border-red-500' : ''}
                placeholder="Digite a mensagem do lembrete..."
                rows={12}
              />
              {errors.message_body && (
                <p className="text-sm text-red-600">{errors.message_body}</p>
              )}
              <p className="text-sm text-gray-500">
                Use linguagem adequada ao tipo de lembrete selecionado
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          {!formData.send_immediately && mode !== 'create' && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (validateForm()) {
                  onSchedule({
                    ...formData,
                    invoice_id: collection.invoice_id,
                    client_id: collection.client_id
                  })
                }
              }}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <Clock className="h-4 w-4" />
              <span>Agendar</span>
            </Button>
          )}
          
          <Button type="submit" disabled={isLoading} className="flex items-center space-x-2">
            <Send className="h-4 w-4" />
            <span>
              {isLoading ? 'Enviando...' : 
               formData.send_immediately ? 'Enviar Agora' : 'Agendar Envio'}
            </span>
          </Button>
        </div>
      </form>
    </div>
  )
}