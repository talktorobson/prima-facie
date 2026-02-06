// =====================================================
// PAYMENT PLAN SERVICE LAYER
// =====================================================

import {
  PaymentPlan,
  PaymentInstallment,
  PaymentPlanFormData,
  PaymentPlanSummary,
  PaymentPlanCalculation,
  InstallmentCalculation,
  PaymentPlanMetrics,
  CollectionAnalytics,
  PaymentFrequency,
  PaymentPlanStatus,
  InstallmentStatus,
  PAYMENT_FREQUENCY_OPTIONS
} from './payment-plan-types'

export class PaymentPlanService {
  
  // ===== PAYMENT PLAN MANAGEMENT =====
  
  async getPaymentPlans(lawFirmId: string): Promise<PaymentPlan[]> {
    // Mock implementation - replace with Supabase in production
    return this.mockPaymentPlans.filter(plan => plan.law_firm_id === lawFirmId)
  }

  async getPaymentPlan(planId: string): Promise<PaymentPlan | null> {
    return this.mockPaymentPlans.find(plan => plan.id === planId) || null
  }

  async createPaymentPlan(
    lawFirmId: string,
    clientId: string,
    formData: PaymentPlanFormData
  ): Promise<PaymentPlan> {
    try {
      // Validate form data
      this.validatePaymentPlanData(formData)
      
      // Calculate installment details
      const calculation = this.calculatePaymentPlan(formData)
      
      // Create payment plan
      const newPlan: PaymentPlan = {
        id: `plan-${Date.now()}`,
        matter_id: formData.matter_id,
        client_id: clientId,
        law_firm_id: lawFirmId,
        plan_name: formData.plan_name,
        total_amount: formData.total_amount,
        installment_count: formData.installment_count,
        installment_amount: calculation.monthly_payment,
        down_payment: formData.down_payment,
        payment_frequency: formData.payment_frequency,
        start_date: formData.start_date,
        end_date: calculation.final_payment_date,
        status: 'draft',
        auto_charge: formData.auto_charge,
        late_fee_percentage: formData.late_fee_percentage,
        grace_period_days: formData.grace_period_days,
        notes: formData.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create installments
      await this.createPaymentInstallments(newPlan.id, calculation.installments)
      
      console.log('Creating payment plan:', newPlan)
      this.mockPaymentPlans.push(newPlan)
      
      return newPlan
    } catch (error) {
      console.error('Error creating payment plan:', error)
      throw error
    }
  }

  async updatePaymentPlan(
    planId: string,
    updates: Partial<PaymentPlanFormData>
  ): Promise<PaymentPlan> {
    const planIndex = this.mockPaymentPlans.findIndex(plan => plan.id === planId)
    if (planIndex === -1) {
      throw new Error('Payment plan not found')
    }

    const updatedPlan = {
      ...this.mockPaymentPlans[planIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    console.log('Updating payment plan:', updatedPlan)
    this.mockPaymentPlans[planIndex] = updatedPlan
    
    return updatedPlan
  }

  async activatePaymentPlan(planId: string): Promise<PaymentPlan> {
    return this.updatePaymentPlanStatus(planId, 'active')
  }

  async cancelPaymentPlan(planId: string, reason?: string): Promise<PaymentPlan> {
    const plan = await this.updatePaymentPlanStatus(planId, 'cancelled')
    
    // Cancel all pending installments
    const installments = await this.getPaymentInstallments(planId)
    for (const installment of installments) {
      if (installment.status === 'pending') {
        await this.updateInstallmentStatus(installment.id, 'cancelled')
      }
    }
    
    console.log('Payment plan cancelled:', { planId, reason })
    return plan
  }

  // ===== INSTALLMENT MANAGEMENT =====

  async getPaymentInstallments(planId: string): Promise<PaymentInstallment[]> {
    return this.mockInstallments.filter(inst => inst.payment_plan_id === planId)
      .sort((a, b) => a.installment_number - b.installment_number)
  }

  async createPaymentInstallments(
    planId: string,
    calculations: InstallmentCalculation[]
  ): Promise<PaymentInstallment[]> {
    const installments: PaymentInstallment[] = calculations.map((calc, index) => ({
      id: `inst-${planId}-${index + 1}`,
      payment_plan_id: planId,
      installment_number: calc.installment_number,
      due_date: calc.due_date,
      amount: calc.amount,
      paid_amount: 0,
      status: 'pending',
      late_fee_applied: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    this.mockInstallments.push(...installments)
    console.log(`Created ${installments.length} installments for plan ${planId}`)
    
    return installments
  }

  async recordPayment(
    installmentId: string,
    amount: number,
    paymentMethod: string,
    transactionId?: string
  ): Promise<PaymentInstallment> {
    const instIndex = this.mockInstallments.findIndex(inst => inst.id === installmentId)
    if (instIndex === -1) {
      throw new Error('Installment not found')
    }

    const installment = this.mockInstallments[instIndex]
    const updatedInstallment = {
      ...installment,
      paid_amount: installment.paid_amount + amount,
      paid_date: new Date().toISOString(),
      status: (installment.paid_amount + amount >= installment.amount) ? 'paid' : 'pending',
      payment_method: paymentMethod,
      transaction_id: transactionId,
      updated_at: new Date().toISOString()
    } as PaymentInstallment

    this.mockInstallments[instIndex] = updatedInstallment
    
    console.log('Payment recorded:', { installmentId, amount, paymentMethod })
    
    // Check if plan is completed
    await this.checkPlanCompletion(installment.payment_plan_id)
    
    return updatedInstallment
  }

  async updateInstallmentStatus(
    installmentId: string,
    status: InstallmentStatus
  ): Promise<PaymentInstallment> {
    const instIndex = this.mockInstallments.findIndex(inst => inst.id === installmentId)
    if (instIndex === -1) {
      throw new Error('Installment not found')
    }

    const updatedInstallment = {
      ...this.mockInstallments[instIndex],
      status,
      updated_at: new Date().toISOString()
    }

    this.mockInstallments[instIndex] = updatedInstallment
    return updatedInstallment
  }

  // ===== CALCULATIONS =====

  calculatePaymentPlan(formData: PaymentPlanFormData): PaymentPlanCalculation {
    const { total_amount, installment_count, down_payment, payment_frequency, start_date } = formData
    
    const remainingAmount = total_amount - down_payment
    const installmentAmount = Math.round((remainingAmount / installment_count) * 100) / 100
    
    const frequency = PAYMENT_FREQUENCY_OPTIONS.find(f => f.value === payment_frequency)
    const frequencyDays = frequency?.days || 30
    
    const installments: InstallmentCalculation[] = []
    const startDateTime = new Date(start_date)
    
    // Add down payment if specified
    if (down_payment > 0) {
      installments.push({
        installment_number: 0,
        due_date: start_date,
        amount: down_payment,
        is_down_payment: true
      })
    }
    
    // Add regular installments
    for (let i = 1; i <= installment_count; i++) {
      const dueDate = new Date(startDateTime)
      dueDate.setDate(dueDate.getDate() + (i * frequencyDays))
      
      installments.push({
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        amount: installmentAmount,
        is_down_payment: false
      })
    }
    
    const finalPaymentDate = installments[installments.length - 1].due_date
    
    return {
      installments,
      total_amount,
      monthly_payment: installmentAmount,
      final_payment_date: finalPaymentDate,
      payment_schedule_summary: `${installment_count}x de ${this.formatCurrency(installmentAmount)} + entrada de ${this.formatCurrency(down_payment)}`
    }
  }

  // ===== ANALYTICS =====

  async getPaymentPlanSummary(planId: string): Promise<PaymentPlanSummary | null> {
    const plan = await this.getPaymentPlan(planId)
    if (!plan) return null
    
    const installments = await this.getPaymentInstallments(planId)
    const totalPaid = installments.reduce((sum, inst) => sum + inst.paid_amount, 0)
    const totalRemaining = plan.total_amount - totalPaid
    
    const pendingInstallments = installments.filter(inst => inst.status === 'pending')
    const nextDueDate = pendingInstallments.length > 0 ? pendingInstallments[0].due_date : undefined
    
    const overdueInstallments = installments.filter(inst => 
      inst.status === 'overdue' || 
      (inst.status === 'pending' && new Date(inst.due_date) < new Date())
    )
    
    return {
      payment_plan: plan,
      installments,
      total_paid: totalPaid,
      total_remaining: totalRemaining,
      next_due_date: nextDueDate,
      overdue_count: overdueInstallments.length,
      overdue_amount: overdueInstallments.reduce((sum, inst) => sum + (inst.amount - inst.paid_amount), 0)
    }
  }

  async getPaymentPlanMetrics(lawFirmId: string): Promise<PaymentPlanMetrics> {
    const plans = await this.getPaymentPlans(lawFirmId)
    
    const totalPlans = plans.length
    const activePlans = plans.filter(p => p.status === 'active').length
    const completedPlans = plans.filter(p => p.status === 'completed').length
    const defaultedPlans = plans.filter(p => p.status === 'defaulted').length
    
    const totalContractedValue = plans.reduce((sum, p) => sum + p.total_amount, 0)
    
    // Calculate total collected from all installments
    let totalCollected = 0
    let overdueAmount = 0
    let next30DaysDue = 0
    
    for (const plan of plans) {
      const installments = await this.getPaymentInstallments(plan.id)
      totalCollected += installments.reduce((sum, inst) => sum + inst.paid_amount, 0)
      
      const overdueInsts = installments.filter(inst => 
        inst.status === 'overdue' || 
        (inst.status === 'pending' && new Date(inst.due_date) < new Date())
      )
      overdueAmount += overdueInsts.reduce((sum, inst) => sum + (inst.amount - inst.paid_amount), 0)
      
      const next30Days = new Date()
      next30Days.setDate(next30Days.getDate() + 30)
      const upcomingInsts = installments.filter(inst => 
        inst.status === 'pending' && 
        new Date(inst.due_date) <= next30Days
      )
      next30DaysDue += upcomingInsts.reduce((sum, inst) => sum + inst.amount, 0)
    }
    
    return {
      law_firm_id: lawFirmId,
      total_plans: totalPlans,
      active_plans: activePlans,
      completed_plans: completedPlans,
      defaulted_plans: defaultedPlans,
      total_contracted_value: totalContractedValue,
      total_collected: totalCollected,
      collection_rate: totalContractedValue > 0 ? (totalCollected / totalContractedValue) * 100 : 0,
      average_plan_value: totalPlans > 0 ? totalContractedValue / totalPlans : 0,
      overdue_amount: overdueAmount,
      next_30_days_due: next30DaysDue
    }
  }

  // ===== UTILITIES =====

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  private validatePaymentPlanData(data: PaymentPlanFormData): void {
    if (!data.plan_name || data.plan_name.length < 3) {
      throw new Error('Plan name must be at least 3 characters long')
    }
    if (data.total_amount <= 0) {
      throw new Error('Total amount must be greater than zero')
    }
    if (data.installment_count < 2 || data.installment_count > 60) {
      throw new Error('Installment count must be between 2 and 60')
    }
    if (data.down_payment < 0 || data.down_payment >= data.total_amount) {
      throw new Error('Down payment must be between 0 and total amount')
    }
    if (data.late_fee_percentage < 0 || data.late_fee_percentage > 10) {
      throw new Error('Late fee percentage must be between 0% and 10%')
    }
  }

  private async updatePaymentPlanStatus(
    planId: string,
    status: PaymentPlanStatus
  ): Promise<PaymentPlan> {
    const planIndex = this.mockPaymentPlans.findIndex(plan => plan.id === planId)
    if (planIndex === -1) {
      throw new Error('Payment plan not found')
    }

    const updatedPlan = {
      ...this.mockPaymentPlans[planIndex],
      status,
      updated_at: new Date().toISOString()
    }

    this.mockPaymentPlans[planIndex] = updatedPlan
    return updatedPlan
  }

  private async checkPlanCompletion(planId: string): Promise<void> {
    const plan = await this.getPaymentPlan(planId)
    if (!plan) return
    
    const installments = await this.getPaymentInstallments(planId)
    const totalPaid = installments.reduce((sum, inst) => sum + inst.paid_amount, 0)
    
    if (totalPaid >= plan.total_amount && plan.status === 'active') {
      await this.updatePaymentPlanStatus(planId, 'completed')
      console.log('Payment plan completed:', planId)
    }
  }

  // ===== MOCK DATA =====

  private mockPaymentPlans: PaymentPlan[] = [
    {
      id: '1',
      matter_id: 'matter-1',
      client_id: 'client-1',
      law_firm_id: 'firm-1',
      plan_name: 'Processo Trabalhista - João Silva',
      total_amount: 15000.00,
      installment_count: 10,
      installment_amount: 1350.00,
      down_payment: 1500.00,
      payment_frequency: 'monthly',
      start_date: '2024-01-15',
      end_date: '2024-11-15',
      status: 'active',
      auto_charge: true,
      late_fee_percentage: 2.0,
      grace_period_days: 5,
      notes: 'Parcelamento para processo trabalhista',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z'
    },
    {
      id: '2',
      matter_id: 'matter-2',
      client_id: 'client-2',
      law_firm_id: 'firm-1',
      plan_name: 'Consultoria Empresarial - Tech Corp',
      total_amount: 25000.00,
      installment_count: 5,
      installment_amount: 4500.00,
      down_payment: 2500.00,
      payment_frequency: 'quarterly',
      start_date: '2024-02-01',
      end_date: '2025-05-01',
      status: 'active',
      auto_charge: false,
      late_fee_percentage: 1.5,
      grace_period_days: 10,
      created_at: '2024-01-25T14:30:00Z',
      updated_at: '2024-01-25T14:30:00Z'
    }
  ]

  private mockInstallments: PaymentInstallment[] = [
    {
      id: 'inst-1-0',
      payment_plan_id: '1',
      installment_number: 0,
      due_date: '2024-01-15',
      amount: 1500.00,
      paid_amount: 1500.00,
      paid_date: '2024-01-15T09:00:00Z',
      status: 'paid',
      late_fee_applied: 0,
      payment_method: 'credit_card',
      transaction_id: 'txn-123456',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-15T09:00:00Z'
    },
    {
      id: 'inst-1-1',
      payment_plan_id: '1',
      installment_number: 1,
      due_date: '2024-02-15',
      amount: 1350.00,
      paid_amount: 1350.00,
      paid_date: '2024-02-14T16:30:00Z',
      status: 'paid',
      late_fee_applied: 0,
      payment_method: 'bank_transfer',
      transaction_id: 'txn-123457',
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-02-14T16:30:00Z'
    },
    {
      id: 'inst-1-2',
      payment_plan_id: '1',
      installment_number: 2,
      due_date: '2024-03-15',
      amount: 1350.00,
      paid_amount: 0,
      status: 'pending',
      late_fee_applied: 0,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-01-10T10:00:00Z'
    }
  ]
}

// Export singleton instance
export const paymentPlanService = new PaymentPlanService()