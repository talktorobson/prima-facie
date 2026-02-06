// Collections Service for Prima Facie
// Phase 8.10.3: Enhanced Accounts Receivable management

import { createClient } from '@/lib/supabase/client';
import type { 
  PaymentCollection,
  PaymentReminder,
  AgingReport
} from './types';

class CollectionsService {
  private supabase = createClient();

  // ====================================
  // PAYMENT COLLECTIONS
  // ====================================

  async getCollections(lawFirmId: string, filters?: {
    status?: string;
    client_id?: string;
    overdue_only?: boolean;
    days_overdue_min?: number;
  }): Promise<PaymentCollection[]> {
    let query = this.supabase
      .from('payment_collections')
      .select(`
        *,
        invoice:invoices(*),
        client:clients(*)
      `)
      .in('client_id', 
        // Subquery to get clients from this law firm
        this.supabase
          .from('clients')
          .select('id')
          .eq('law_firm_id', lawFirmId)
      );

    if (filters?.status) {
      query = query.eq('collection_status', filters.status);
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.overdue_only) {
      query = query.gt('days_overdue', 0);
    }

    if (filters?.days_overdue_min) {
      query = query.gte('days_overdue', filters.days_overdue_min);
    }

    query = query.order('days_overdue', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getCollection(collectionId: string): Promise<PaymentCollection | null> {
    const { data, error } = await this.supabase
      .from('payment_collections')
      .select(`
        *,
        invoice:invoices(*),
        client:clients(*)
      `)
      .eq('id', collectionId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateCollection(collectionId: string, updates: Partial<PaymentCollection>): Promise<PaymentCollection> {
    const { data, error } = await this.supabase
      .from('payment_collections')
      .update(updates)
      .eq('id', collectionId)
      .select(`
        *,
        invoice:invoices(*),
        client:clients(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async addPromiseToPay(
    collectionId: string, 
    promiseDate: string, 
    amount: number, 
    notes: string
  ): Promise<PaymentCollection> {
    const { data, error } = await this.supabase
      .from('payment_collections')
      .update({
        promise_to_pay_date: promiseDate,
        promise_to_pay_amount: amount,
        promise_to_pay_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .select(`
        *,
        invoice:invoices(*),
        client:clients(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async markAsDisputed(collectionId: string, reason: string): Promise<PaymentCollection> {
    const { data, error } = await this.supabase
      .from('payment_collections')
      .update({
        is_disputed: true,
        dispute_reason: reason,
        dispute_date: new Date().toISOString().split('T')[0],
        collection_status: 'disputed',
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .select(`
        *,
        invoice:invoices(*),
        client:clients(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async resolveDispute(collectionId: string): Promise<PaymentCollection> {
    // Get current collection to determine appropriate status
    const collection = await this.getCollection(collectionId);
    if (!collection) throw new Error('Collection not found');

    const newStatus = collection.days_overdue > 90 ? 'in_collection' :
                     collection.days_overdue > 60 ? 'overdue_90' :
                     collection.days_overdue > 30 ? 'overdue_60' :
                     collection.days_overdue > 0 ? 'overdue_30' : 'current';

    const { data, error } = await this.supabase
      .from('payment_collections')
      .update({
        is_disputed: false,
        dispute_resolved_date: new Date().toISOString().split('T')[0],
        collection_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .select(`
        *,
        invoice:invoices(*),
        client:clients(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async writeOff(collectionId: string, amount: number, reason: string): Promise<PaymentCollection> {
    const userId = (await this.supabase.auth.getUser()).data.user?.id;

    const { data, error } = await this.supabase
      .from('payment_collections')
      .update({
        collection_status: 'written_off',
        written_off_date: new Date().toISOString().split('T')[0],
        written_off_amount: amount,
        written_off_reason: reason,
        written_off_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .select(`
        *,
        invoice:invoices(*),
        client:clients(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async assignCollectionAgent(collectionId: string, agentId: string): Promise<PaymentCollection> {
    const { data, error } = await this.supabase
      .from('payment_collections')
      .update({
        collection_agent_id: agentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', collectionId)
      .select(`
        *,
        invoice:invoices(*),
        client:clients(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // ====================================
  // PAYMENT REMINDERS
  // ====================================

  async getReminders(filters?: {
    invoice_id?: string;
    client_id?: string;
    status?: string;
    reminder_type?: string;
  }): Promise<PaymentReminder[]> {
    let query = this.supabase
      .from('payment_reminders')
      .select('*');

    if (filters?.invoice_id) {
      query = query.eq('invoice_id', filters.invoice_id);
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.reminder_type) {
      query = query.eq('reminder_type', filters.reminder_type);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async createReminder(reminderData: Partial<PaymentReminder>): Promise<PaymentReminder> {
    const userId = (await this.supabase.auth.getUser()).data.user?.id;

    const { data, error } = await this.supabase
      .from('payment_reminders')
      .insert({
        ...reminderData,
        status: 'scheduled',
        created_by: userId
      })
      .select()
      .single();

    if (error) throw error;

    // Update collection reminder count
    if (reminderData.invoice_id) {
      await this.incrementReminderCount(reminderData.invoice_id);
    }

    return data;
  }

  async sendReminder(reminderId: string): Promise<PaymentReminder> {
    const userId = (await this.supabase.auth.getUser()).data.user?.id;

    const { data, error } = await this.supabase
      .from('payment_reminders')
      .update({
        status: 'sent',
        sent_date: new Date().toISOString(),
        sent_by: userId
      })
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;

    // Update collection last reminder sent date
    if (data.invoice_id) {
      await this.updateLastReminderSent(data.invoice_id);
    }

    return data;
  }

  async markReminderFailed(reminderId: string, failureReason: string): Promise<PaymentReminder> {
    const { data, error } = await this.supabase
      .from('payment_reminders')
      .update({
        status: 'failed',
        failure_reason: failureReason
      })
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async recordClientResponse(reminderId: string, responseNotes: string): Promise<PaymentReminder> {
    const { data, error } = await this.supabase
      .from('payment_reminders')
      .update({
        client_responded: true,
        response_date: new Date().toISOString(),
        response_notes: responseNotes
      })
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async incrementReminderCount(invoiceId: string): Promise<void> {
    // Find collection by invoice_id and increment reminder count
    const { error } = await this.supabase.rpc('increment_reminder_count', {
      p_invoice_id: invoiceId
    });

    // If the RPC doesn't exist, update manually
    if (error) {
      const { data: collection } = await this.supabase
        .from('payment_collections')
        .select('reminder_count')
        .eq('invoice_id', invoiceId)
        .single();

      if (collection) {
        await this.supabase
          .from('payment_collections')
          .update({
            reminder_count: (collection.reminder_count || 0) + 1
          })
          .eq('invoice_id', invoiceId);
      }
    }
  }

  private async updateLastReminderSent(invoiceId: string): Promise<void> {
    await this.supabase
      .from('payment_collections')
      .update({
        last_reminder_sent: new Date().toISOString().split('T')[0]
      })
      .eq('invoice_id', invoiceId);
  }

  // ====================================
  // AGING REPORTS
  // ====================================

  async generateAgingReport(lawFirmId: string): Promise<AgingReport> {
    const today = new Date().toISOString().split('T')[0];

    // Get receivables (collections)
    const { data: collections } = await this.getCollections(lawFirmId);
    
    // Get payables (bills) - this would need to be coordinated with financial service
    // For now, using a simplified approach
    const { data: bills } = await this.supabase
      .from('bills')
      .select(`
        *,
        vendor:vendors(name),
        expense_category:expense_categories(name)
      `)
      .eq('law_firm_id', lawFirmId)
      .in('payment_status', ['pending', 'partial', 'overdue']);

    // Calculate receivables aging
    const receivablesAging = {
      current: 0,
      overdue_30: 0,
      overdue_60: 0,
      overdue_90: 0,
      over_90: 0,
      total: 0
    };

    collections?.forEach(collection => {
      const amount = collection.invoice?.balance_due || 0;
      const daysOverdue = collection.days_overdue;

      if (daysOverdue <= 0) {
        receivablesAging.current += amount;
      } else if (daysOverdue <= 30) {
        receivablesAging.overdue_30 += amount;
      } else if (daysOverdue <= 60) {
        receivablesAging.overdue_60 += amount;
      } else if (daysOverdue <= 90) {
        receivablesAging.overdue_90 += amount;
      } else {
        receivablesAging.over_90 += amount;
      }

      receivablesAging.total += amount;
    });

    // Calculate payables aging
    const payablesAging = {
      current: 0,
      overdue_30: 0,
      overdue_60: 0,
      overdue_90: 0,
      over_90: 0,
      total: 0
    };

    bills?.forEach(bill => {
      const amount = bill.balance_due;
      const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(bill.due_date).getTime()) / (1000 * 3600 * 24)));

      if (daysOverdue <= 0) {
        payablesAging.current += amount;
      } else if (daysOverdue <= 30) {
        payablesAging.overdue_30 += amount;
      } else if (daysOverdue <= 60) {
        payablesAging.overdue_60 += amount;
      } else if (daysOverdue <= 90) {
        payablesAging.overdue_90 += amount;
      } else {
        payablesAging.over_90 += amount;
      }

      payablesAging.total += amount;
    });

    return {
      as_of_date: today,
      receivables_current: receivablesAging.current,
      receivables_overdue_30: receivablesAging.overdue_30,
      receivables_overdue_60: receivablesAging.overdue_60,
      receivables_overdue_90: receivablesAging.overdue_90,
      receivables_over_90: receivablesAging.over_90,
      receivables_total: receivablesAging.total,
      payables_current: payablesAging.current,
      payables_overdue_30: payablesAging.overdue_30,
      payables_overdue_60: payablesAging.overdue_60,
      payables_overdue_90: payablesAging.overdue_90,
      payables_over_90: payablesAging.over_90,
      payables_total: payablesAging.total,
      receivables_details: collections || [],
      payables_details: bills || []
    };
  }

  // ====================================
  // AUTOMATED PROCESSES
  // ====================================

  async updateCollectionStatuses(lawFirmId: string): Promise<void> {
    // This would typically be run as a scheduled job
    const collections = await this.getCollections(lawFirmId);

    for (const collection of collections) {
      const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(collection.invoice?.due_date || '').getTime()) / (1000 * 3600 * 24)));
      
      let newStatus = collection.collection_status;
      
      if (collection.is_disputed) {
        newStatus = 'disputed';
      } else if (collection.written_off_date) {
        newStatus = 'written_off';
      } else if (daysOverdue <= 0) {
        newStatus = 'current';
      } else if (daysOverdue <= 30) {
        newStatus = 'overdue_30';
      } else if (daysOverdue <= 60) {
        newStatus = 'overdue_60';
      } else if (daysOverdue <= 90) {
        newStatus = 'overdue_90';
      } else {
        newStatus = 'in_collection';
      }

      if (newStatus !== collection.collection_status) {
        await this.updateCollection(collection.id, {
          collection_status: newStatus,
          days_overdue: daysOverdue
        });
      }
    }
  }

  async generateAutomaticReminders(lawFirmId: string): Promise<PaymentReminder[]> {
    // Get collections that need reminders
    const collections = await this.getCollections(lawFirmId, { overdue_only: true });
    const reminders: PaymentReminder[] = [];

    for (const collection of collections) {
      // Check if reminder is due based on last reminder sent and reminder count
      const daysSinceLastReminder = collection.last_reminder_sent 
        ? Math.floor((new Date().getTime() - new Date(collection.last_reminder_sent).getTime()) / (1000 * 3600 * 24))
        : 999;

      const reminderCount = collection.reminder_count || 0;
      let shouldSendReminder = false;
      let reminderType: PaymentReminder['reminder_type'] = 'friendly';

      // Reminder logic based on days overdue and reminder count
      if (collection.days_overdue >= 7 && reminderCount === 0) {
        shouldSendReminder = true;
        reminderType = 'friendly';
      } else if (collection.days_overdue >= 15 && reminderCount <= 1 && daysSinceLastReminder >= 7) {
        shouldSendReminder = true;
        reminderType = 'first_overdue';
      } else if (collection.days_overdue >= 30 && reminderCount <= 3 && daysSinceLastReminder >= 7) {
        shouldSendReminder = true;
        reminderType = 'second_overdue';
      } else if (collection.days_overdue >= 60 && reminderCount <= 5 && daysSinceLastReminder >= 10) {
        shouldSendReminder = true;
        reminderType = 'final_notice';
      } else if (collection.days_overdue >= 90 && daysSinceLastReminder >= 15) {
        shouldSendReminder = true;
        reminderType = 'collection_notice';
      }

      if (shouldSendReminder) {
        const reminder = await this.createReminder({
          invoice_id: collection.invoice_id,
          client_id: collection.client_id,
          reminder_type: reminderType,
          send_method: 'email',
          scheduled_date: new Date().toISOString().split('T')[0],
          recipient_email: collection.client?.email,
          subject: this.generateReminderSubject(reminderType, collection),
          message_body: this.generateReminderMessage(reminderType, collection)
        });

        reminders.push(reminder);
      }
    }

    return reminders;
  }

  private generateReminderSubject(type: PaymentReminder['reminder_type'], collection: PaymentCollection): string {
    const invoiceNumber = collection.invoice?.invoice_number || '';
    const daysOverdue = collection.days_overdue;

    switch (type) {
      case 'friendly':
        return `Lembrete amigável - Fatura ${invoiceNumber}`;
      case 'first_overdue':
        return `Fatura em atraso - ${invoiceNumber} (${daysOverdue} dias)`;
      case 'second_overdue':
        return `Segundo aviso - Fatura ${invoiceNumber} (${daysOverdue} dias de atraso)`;
      case 'final_notice':
        return `AVISO FINAL - Fatura ${invoiceNumber} (${daysOverdue} dias de atraso)`;
      case 'collection_notice':
        return `COBRANÇA JUDICIAL - Fatura ${invoiceNumber} será protestada`;
      default:
        return `Lembrete de pagamento - Fatura ${invoiceNumber}`;
    }
  }

  private generateReminderMessage(type: PaymentReminder['reminder_type'], collection: PaymentCollection): string {
    const clientName = collection.client?.name || 'Cliente';
    const invoiceNumber = collection.invoice?.invoice_number || '';
    const amount = collection.invoice?.balance_due || 0;
    const daysOverdue = collection.days_overdue;
    const dueDate = collection.invoice?.due_date ? new Date(collection.invoice.due_date).toLocaleDateString('pt-BR') : '';

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    // This would use the same logic as in the PaymentReminderForm component
    // Simplified version here for automatic generation
    return `Prezado(a) ${clientName},

Fatura: ${invoiceNumber}
Valor: ${formatCurrency(amount)}
Vencimento: ${dueDate}
Dias de atraso: ${daysOverdue}

Por favor, regularize o pagamento o quanto antes.

Atenciosamente,
Equipe Financeira`;
  }
}

export const collectionsService = new CollectionsService();