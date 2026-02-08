import type { SupabaseClient } from '@supabase/supabase-js'

interface PageContext {
  contextType?: string
  entityId?: string
}

export async function buildContextInfo(
  supabase: SupabaseClient,
  lawFirmId: string | null,
  pageContext?: PageContext
): Promise<string | undefined> {
  if (!pageContext?.contextType || !pageContext?.entityId || !lawFirmId) {
    return undefined
  }

  const { contextType, entityId } = pageContext

  switch (contextType) {
    case 'matter':
      return buildMatterContext(supabase, entityId, lawFirmId)
    case 'client':
      return buildClientContext(supabase, entityId, lawFirmId)
    case 'task':
      return buildTaskContext(supabase, entityId, lawFirmId)
    default:
      return undefined
  }
}

async function buildMatterContext(
  supabase: SupabaseClient,
  matterId: string,
  lawFirmId: string
): Promise<string | undefined> {
  const { data: matter } = await supabase
    .from('matters')
    .select('title, matter_number, status, priority, billing_method, court_name, process_number, opened_date, next_court_date')
    .eq('id', matterId)
    .eq('law_firm_id', lawFirmId)
    .single()

  if (!matter) return undefined

  return `O usuário está visualizando o processo:
- **Título**: ${matter.title}
- **Número**: ${matter.matter_number}
- **Status**: ${matter.status || 'não definido'}
- **Prioridade**: ${matter.priority || 'não definida'}
- **Método de cobrança**: ${matter.billing_method || 'não definido'}
${matter.court_name ? `- **Tribunal**: ${matter.court_name}` : ''}
${matter.process_number ? `- **Número do processo**: ${matter.process_number}` : ''}
${matter.next_court_date ? `- **Próxima audiência**: ${new Date(matter.next_court_date).toLocaleDateString('pt-BR')}` : ''}`
}

async function buildClientContext(
  supabase: SupabaseClient,
  contactId: string,
  lawFirmId: string
): Promise<string | undefined> {
  const { data: contact } = await supabase
    .from('contacts')
    .select('full_name, company_name, contact_type, email, phone, client_status, cpf, cnpj')
    .eq('id', contactId)
    .eq('law_firm_id', lawFirmId)
    .single()

  if (!contact) return undefined

  const name = contact.contact_type === 'company' ? contact.company_name : contact.full_name
  const doc = contact.contact_type === 'company' ? contact.cnpj : contact.cpf

  return `O usuário está visualizando o cliente:
- **Nome**: ${name || 'não informado'}
- **Tipo**: ${contact.contact_type === 'company' ? 'Pessoa Jurídica' : 'Pessoa Física'}
${doc ? `- **Documento**: ${doc}` : ''}
- **Email**: ${contact.email || 'não informado'}
- **Status**: ${contact.client_status || 'não definido'}`
}

async function buildTaskContext(
  supabase: SupabaseClient,
  taskId: string,
  lawFirmId: string
): Promise<string | undefined> {
  const { data: task } = await supabase
    .from('tasks')
    .select('title, description, status, priority, due_date, task_type')
    .eq('id', taskId)
    .eq('law_firm_id', lawFirmId)
    .single()

  if (!task) return undefined

  return `O usuário está visualizando a tarefa:
- **Título**: ${task.title}
- **Status**: ${task.status || 'pendente'}
- **Prioridade**: ${task.priority || 'não definida'}
- **Tipo**: ${task.task_type || 'geral'}
${task.due_date ? `- **Prazo**: ${new Date(task.due_date).toLocaleDateString('pt-BR')}` : ''}
${task.description ? `- **Descrição**: ${task.description}` : ''}`
}
