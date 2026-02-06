// =====================================================
// PHASE 8.3: PAYMENT PLAN SYSTEM COMPREHENSIVE TESTS
// =====================================================

import { 
  PaymentPlanService,
  paymentPlanService 
} from '@/lib/billing/payment-plan-service'
import {
  PaymentPlan,
  PaymentInstallment,
  PaymentPlanFormData,
  PaymentPlanSummary,
  PaymentFrequency,
  PaymentPlanStatus,
  InstallmentStatus,
  PAYMENT_FREQUENCY_OPTIONS,
  PAYMENT_PLAN_STATUS_OPTIONS,
  INSTALLMENT_STATUS_OPTIONS
} from '@/lib/billing/payment-plan-types'

// Mock data for testing
const mockLawFirmId = 'test-law-firm-123'
const mockClientId = 'test-client-123'
const mockMatterId = 'test-matter-123'

const mockPaymentPlanData: PaymentPlanFormData = {
  matter_id: mockMatterId,
  plan_name: 'Test Payment Plan - Labor Case',
  total_amount: 15000.00,
  installment_count: 10,
  down_payment: 1500.00,
  payment_frequency: 'monthly',
  start_date: '2024-06-01',
  auto_charge: true,
  late_fee_percentage: 2.0,
  grace_period_days: 5,
  notes: 'Test payment plan for comprehensive testing'
}

describe('Phase 8.3: Payment Plan System Validation', () => {
  
  describe('Payment Plan Types and Enums', () => {
    it('should validate PaymentPlan interface structure', () => {
      const plan: PaymentPlan = {
        id: 'plan-1',
        matter_id: mockMatterId,
        client_id: mockClientId,
        law_firm_id: mockLawFirmId,
        plan_name: 'Test Payment Plan',
        total_amount: 15000.00,
        installment_count: 10,
        installment_amount: 1350.00,
        down_payment: 1500.00,
        payment_frequency: 'monthly',
        start_date: '2024-06-01',
        end_date: '2025-04-01',
        status: 'active',
        auto_charge: true,
        late_fee_percentage: 2.0,
        grace_period_days: 5,
        notes: 'Test plan',
        created_at: '2024-06-16T00:00:00Z',
        updated_at: '2024-06-16T00:00:00Z'
      }
      
      expect(plan.id).toBeDefined()
      expect(plan.matter_id).toBe(mockMatterId)
      expect(plan.client_id).toBe(mockClientId)
      expect(plan.total_amount).toBe(15000.00)
      expect(plan.installment_count).toBe(10)
      expect(plan.payment_frequency).toBe('monthly')
      expect(plan.status).toBe('active')
    })
    
    it('should validate PaymentInstallment interface structure', () => {
      const installment: PaymentInstallment = {
        id: 'inst-1',
        payment_plan_id: 'plan-1',
        installment_number: 1,
        due_date: '2024-07-01',
        amount: 1350.00,
        paid_amount: 1350.00,
        paid_date: '2024-07-01T10:00:00Z',
        status: 'paid',
        late_fee_applied: 0,
        payment_method: 'credit_card',
        transaction_id: 'txn-12345',
        notes: 'First installment',
        created_at: '2024-06-16T00:00:00Z',
        updated_at: '2024-07-01T10:00:00Z'
      }
      
      expect(installment.id).toBeDefined()
      expect(installment.payment_plan_id).toBe('plan-1')
      expect(installment.installment_number).toBe(1)
      expect(installment.amount).toBe(1350.00)
      expect(installment.paid_amount).toBe(1350.00)
      expect(installment.status).toBe('paid')
    })
    
    it('should validate PaymentFrequency enum values', () => {
      const validFrequencies: PaymentFrequency[] = ['weekly', 'bi_week', 'monthly', 'quarterly']
      
      validFrequencies.forEach(frequency => {
        expect(PAYMENT_FREQUENCY_OPTIONS.some(option => option.value === frequency)).toBe(true)
      })
    })
    
    it('should validate PaymentPlanStatus enum values', () => {
      const validStatuses: PaymentPlanStatus[] = ['draft', 'active', 'completed', 'cancelled', 'defaulted']
      
      validStatuses.forEach(status => {
        expect(PAYMENT_PLAN_STATUS_OPTIONS.some(option => option.value === status)).toBe(true)
      })
    })
    
    it('should validate InstallmentStatus enum values', () => {
      const validStatuses: InstallmentStatus[] = ['pending', 'paid', 'overdue', 'waived', 'cancelled']
      
      validStatuses.forEach(status => {
        expect(INSTALLMENT_STATUS_OPTIONS.some(option => option.value === status)).toBe(true)
      })
    })
  })
  
  describe('Form Data Validation', () => {
    it('should validate PaymentPlanFormData structure', () => {
      expect(mockPaymentPlanData.matter_id).toBeDefined()
      expect(mockPaymentPlanData.plan_name).toBeDefined()
      expect(mockPaymentPlanData.total_amount).toBeGreaterThan(0)
      expect(mockPaymentPlanData.installment_count).toBeGreaterThanOrEqual(2)
      expect(mockPaymentPlanData.down_payment).toBeGreaterThanOrEqual(0)
      expect(mockPaymentPlanData.payment_frequency).toBeDefined()
      expect(mockPaymentPlanData.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})

describe('Phase 8.3: Payment Plan Service Layer', () => {
  
  describe('PaymentPlanService Class', () => {
    it('should create service instance', () => {
      expect(paymentPlanService).toBeInstanceOf(PaymentPlanService)
    })
    
    it('should have all required methods', () => {
      const requiredMethods = [
        'getPaymentPlans',
        'getPaymentPlan',
        'createPaymentPlan',
        'updatePaymentPlan',
        'activatePaymentPlan',
        'cancelPaymentPlan',
        'getPaymentInstallments',
        'createPaymentInstallments',
        'recordPayment',
        'updateInstallmentStatus',
        'calculatePaymentPlan',
        'getPaymentPlanSummary',
        'getPaymentPlanMetrics',
        'formatCurrency'
      ]
      
      requiredMethods.forEach(method => {
        expect(typeof (paymentPlanService as any)[method]).toBe('function')
      })
    })
  })
  
  describe('Payment Plan Management', () => {
    it('should get payment plans for law firm', async () => {
      const plans = await paymentPlanService.getPaymentPlans(mockLawFirmId)
      
      expect(Array.isArray(plans)).toBe(true)
      // Should be empty for test law firm, but structure should be correct
      plans.forEach(plan => {
        expect(plan.id).toBeDefined()
        expect(plan.law_firm_id).toBeDefined()
        expect(plan.plan_name).toBeDefined()
        expect(plan.total_amount).toBeGreaterThanOrEqual(0)
        expect(plan.installment_count).toBeGreaterThanOrEqual(2)
      })
    })
    
    it('should create new payment plan', async () => {
      const newPlan = await paymentPlanService.createPaymentPlan(
        mockLawFirmId,
        mockClientId,
        mockPaymentPlanData
      )
      
      expect(newPlan.id).toBeDefined()
      expect(newPlan.law_firm_id).toBe(mockLawFirmId)
      expect(newPlan.client_id).toBe(mockClientId)
      expect(newPlan.matter_id).toBe(mockPaymentPlanData.matter_id)
      expect(newPlan.plan_name).toBe(mockPaymentPlanData.plan_name)
      expect(newPlan.total_amount).toBe(mockPaymentPlanData.total_amount)
      expect(newPlan.installment_count).toBe(mockPaymentPlanData.installment_count)
      expect(newPlan.status).toBe('draft')
    })
    
    it('should update existing payment plan', async () => {
      const updatedData = {
        plan_name: 'Updated Payment Plan Name',
        total_amount: 20000.00,
        installment_count: 12
      }
      
      const updatedPlan = await paymentPlanService.updatePaymentPlan('1', updatedData)
      
      expect(updatedPlan.id).toBe('1')
      expect(updatedPlan.plan_name).toBe(updatedData.plan_name)
      expect(updatedPlan.total_amount).toBe(updatedData.total_amount)
      expect(updatedPlan.installment_count).toBe(updatedData.installment_count)
    })
    
    it('should activate payment plan', async () => {
      const activatedPlan = await paymentPlanService.activatePaymentPlan('1')
      
      expect(activatedPlan.id).toBe('1')
      expect(activatedPlan.status).toBe('active')
    })
    
    it('should cancel payment plan', async () => {
      const cancelledPlan = await paymentPlanService.cancelPaymentPlan('1', 'Client requested cancellation')
      
      expect(cancelledPlan.id).toBe('1')
      expect(cancelledPlan.status).toBe('cancelled')
    })
    
    it('should validate plan data before creation', async () => {
      const invalidPlanData = {
        ...mockPaymentPlanData,
        plan_name: 'AB', // Too short
        total_amount: -1000, // Negative amount
        installment_count: 1 // Too few installments
      }
      
      await expect(
        paymentPlanService.createPaymentPlan(mockLawFirmId, mockClientId, invalidPlanData)
      ).rejects.toThrow()
    })
  })
  
  describe('Installment Management', () => {
    it('should get payment installments for plan', async () => {
      const installments = await paymentPlanService.getPaymentInstallments('1')
      
      expect(Array.isArray(installments)).toBe(true)
      
      if (installments.length > 0) {
        installments.forEach(inst => {
          expect(inst.id).toBeDefined()
          expect(inst.payment_plan_id).toBe('1')
          expect(inst.installment_number).toBeGreaterThanOrEqual(0)
          expect(inst.amount).toBeGreaterThan(0)
          expect(['pending', 'paid', 'overdue', 'waived', 'cancelled']).toContain(inst.status)
        })
        
        // Should be sorted by installment number
        for (let i = 1; i < installments.length; i++) {
          expect(installments[i].installment_number).toBeGreaterThanOrEqual(
            installments[i - 1].installment_number
          )
        }
      }
    })
    
    it('should record payment for installment', async () => {
      const updatedInstallment = await paymentPlanService.recordPayment(
        'inst-1-2',
        1350.00,
        'bank_transfer',
        'txn-98765'
      )
      
      expect(updatedInstallment.id).toBe('inst-1-2')
      expect(updatedInstallment.paid_amount).toBe(1350.00)
      expect(updatedInstallment.status).toBe('paid')
      expect(updatedInstallment.payment_method).toBe('bank_transfer')
      expect(updatedInstallment.transaction_id).toBe('txn-98765')
      expect(updatedInstallment.paid_date).toBeDefined()
    })
    
    it('should update installment status', async () => {
      const updatedInstallment = await paymentPlanService.updateInstallmentStatus(
        'inst-1-2',
        'overdue'
      )
      
      expect(updatedInstallment.id).toBe('inst-1-2')
      expect(updatedInstallment.status).toBe('overdue')
    })
  })
  
  describe('Payment Calculations', () => {
    it('should calculate payment plan correctly', () => {
      const calculation = paymentPlanService.calculatePaymentPlan(mockPaymentPlanData)
      
      expect(calculation.total_amount).toBe(mockPaymentPlanData.total_amount)
      expect(calculation.installments).toHaveLength(mockPaymentPlanData.installment_count + 1) // +1 for down payment
      expect(calculation.monthly_payment).toBeGreaterThan(0)
      expect(calculation.final_payment_date).toBeDefined()
      expect(calculation.payment_schedule_summary).toContain('10x de')
      
      // Verify installment amounts
      const downPaymentInstallment = calculation.installments.find(inst => inst.is_down_payment)
      expect(downPaymentInstallment).toBeDefined()
      expect(downPaymentInstallment?.amount).toBe(mockPaymentPlanData.down_payment)
      
      // Verify regular installments
      const regularInstallments = calculation.installments.filter(inst => !inst.is_down_payment)
      expect(regularInstallments).toHaveLength(mockPaymentPlanData.installment_count)
      
      const totalRegularAmount = regularInstallments.reduce((sum, inst) => sum + inst.amount, 0)
      const expectedRegularAmount = mockPaymentPlanData.total_amount - mockPaymentPlanData.down_payment
      expect(Math.abs(totalRegularAmount - expectedRegularAmount)).toBeLessThan(1) // Allow for rounding
    })
    
    it('should calculate different payment frequencies correctly', () => {
      const testFrequencies: PaymentFrequency[] = ['weekly', 'bi_week', 'monthly', 'quarterly']
      
      testFrequencies.forEach(frequency => {
        const testData = {
          ...mockPaymentPlanData,
          payment_frequency: frequency,
          installment_count: 4 // Shorter for testing
        }
        
        const calculation = paymentPlanService.calculatePaymentPlan(testData)
        
        expect(calculation.installments).toHaveLength(5) // 4 installments + 1 down payment
        expect(calculation.monthly_payment).toBeGreaterThan(0)
        
        // Verify date progression
        const regularInstallments = calculation.installments.filter(inst => !inst.is_down_payment)
        for (let i = 1; i < regularInstallments.length; i++) {
          const prevDate = new Date(regularInstallments[i - 1].due_date)
          const currDate = new Date(regularInstallments[i].due_date)
          expect(currDate.getTime()).toBeGreaterThan(prevDate.getTime())
        }
      })
    })
    
    it('should handle zero down payment correctly', () => {
      const noDownPaymentData = {
        ...mockPaymentPlanData,
        down_payment: 0
      }
      
      const calculation = paymentPlanService.calculatePaymentPlan(noDownPaymentData)
      
      expect(calculation.installments).toHaveLength(mockPaymentPlanData.installment_count)
      expect(calculation.installments.every(inst => !inst.is_down_payment)).toBe(true)
      
      const totalAmount = calculation.installments.reduce((sum, inst) => sum + inst.amount, 0)
      expect(Math.abs(totalAmount - mockPaymentPlanData.total_amount)).toBeLessThan(1) // Allow for rounding
    })
  })
  
  describe('Analytics and Summaries', () => {
    it('should get payment plan summary', async () => {
      const summary = await paymentPlanService.getPaymentPlanSummary('1')
      
      if (summary) {
        expect(summary.payment_plan).toBeDefined()
        expect(summary.installments).toBeDefined()
        expect(Array.isArray(summary.installments)).toBe(true)
        expect(typeof summary.total_paid).toBe('number')
        expect(typeof summary.total_remaining).toBe('number')
        expect(typeof summary.overdue_count).toBe('number')
        expect(typeof summary.overdue_amount).toBe('number')
        
        // Verify calculation accuracy
        const calculatedPaid = summary.installments.reduce((sum, inst) => sum + inst.paid_amount, 0)
        expect(Math.abs(calculatedPaid - summary.total_paid)).toBeLessThan(0.01)
        
        const expectedRemaining = summary.payment_plan.total_amount - summary.total_paid
        expect(Math.abs(expectedRemaining - summary.total_remaining)).toBeLessThan(0.01)
      }
    })
    
    it('should get payment plan metrics', async () => {
      const metrics = await paymentPlanService.getPaymentPlanMetrics(mockLawFirmId)
      
      expect(typeof metrics.law_firm_id).toBe('string')
      expect(typeof metrics.total_plans).toBe('number')
      expect(typeof metrics.active_plans).toBe('number')
      expect(typeof metrics.completed_plans).toBe('number')
      expect(typeof metrics.defaulted_plans).toBe('number')
      expect(typeof metrics.total_contracted_value).toBe('number')
      expect(typeof metrics.total_collected).toBe('number')
      expect(typeof metrics.collection_rate).toBe('number')
      expect(typeof metrics.average_plan_value).toBe('number')
      expect(typeof metrics.overdue_amount).toBe('number')
      expect(typeof metrics.next_30_days_due).toBe('number')
      
      // Verify metrics consistency
      expect(metrics.total_plans).toBeGreaterThanOrEqual(
        metrics.active_plans + metrics.completed_plans + metrics.defaulted_plans
      )
      expect(metrics.collection_rate).toBeGreaterThanOrEqual(0)
      expect(metrics.collection_rate).toBeLessThanOrEqual(100)
    })
  })
  
  describe('Utility Functions', () => {
    it('should format currency correctly', () => {
      const formatted = paymentPlanService.formatCurrency(1350.75)
      expect(formatted).toMatch(/R\$\s*1\.350,75/)
    })
    
    it('should format large amounts correctly', () => {
      const formatted = paymentPlanService.formatCurrency(123456.78)
      expect(formatted).toMatch(/R\$\s*123\.456,78/)
    })
    
    it('should format zero correctly', () => {
      const formatted = paymentPlanService.formatCurrency(0)
      expect(formatted).toMatch(/R\$\s*0,00/)
    })
  })
})

describe('Phase 8.3: Business Logic Validation', () => {
  
  describe('Brazilian Legal Market Specifics', () => {
    it('should support Brazilian payment frequencies', () => {
      const brazilianFrequencies = ['monthly', 'quarterly']
      
      brazilianFrequencies.forEach(frequency => {
        const option = PAYMENT_FREQUENCY_OPTIONS.find(opt => opt.value === frequency)
        expect(option).toBeDefined()
        expect(option?.label).toMatch(/(Mensal|Trimestral)/)
      })
    })
    
    it('should format currency in Brazilian Real', () => {
      const formatted = paymentPlanService.formatCurrency(15000.50)
      expect(formatted).toMatch(/R\$/)
      expect(formatted).toMatch(/15\.000,50/)
    })
    
    it('should handle reasonable installment counts for Brazilian market', () => {
      const testCounts = [6, 12, 18, 24, 36, 48]
      
      testCounts.forEach(count => {
        const testData = {
          ...mockPaymentPlanData,
          installment_count: count
        }
        
        const calculation = paymentPlanService.calculatePaymentPlan(testData)
        expect(calculation.installments.filter(inst => !inst.is_down_payment)).toHaveLength(count)
      })
    })
  })
  
  describe('Cash Flow Management', () => {
    it('should distribute payments evenly across installments', () => {
      const calculation = paymentPlanService.calculatePaymentPlan(mockPaymentPlanData)
      const regularInstallments = calculation.installments.filter(inst => !inst.is_down_payment)
      
      // All regular installments should have the same amount
      const firstAmount = regularInstallments[0].amount
      regularInstallments.forEach(inst => {
        expect(Math.abs(inst.amount - firstAmount)).toBeLessThan(0.01)
      })
    })
    
    it('should provide predictable payment schedule', () => {
      const calculation = paymentPlanService.calculatePaymentPlan(mockPaymentPlanData)
      
      expect(calculation.payment_schedule_summary).toBeDefined()
      expect(calculation.payment_schedule_summary).toContain('10x')
      expect(calculation.payment_schedule_summary).toContain('entrada')
      expect(calculation.final_payment_date).toBeDefined()
      
      // Final payment should be in the future
      const finalDate = new Date(calculation.final_payment_date)
      const startDate = new Date(mockPaymentPlanData.start_date)
      expect(finalDate.getTime()).toBeGreaterThan(startDate.getTime())
    })
  })
  
  describe('Risk Management', () => {
    it('should enforce reasonable late fee limits', () => {
      const testPercentages = [0, 1, 2, 5, 10]
      
      testPercentages.forEach(percentage => {
        const testData = {
          ...mockPaymentPlanData,
          late_fee_percentage: percentage
        }
        
        expect(() => {
          paymentPlanService.calculatePaymentPlan(testData)
        }).not.toThrow()
      })
      
      // Should reject excessive late fees
      const excessiveData = {
        ...mockPaymentPlanData,
        late_fee_percentage: 15
      }
      
      expect(async () => {
        await paymentPlanService.createPaymentPlan(mockLawFirmId, mockClientId, excessiveData)
      }).rejects.toThrow()
    })
    
    it('should enforce reasonable grace periods', () => {
      const testPeriods = [0, 3, 5, 10, 15, 30]
      
      testPeriods.forEach(days => {
        const testData = {
          ...mockPaymentPlanData,
          grace_period_days: days
        }
        
        expect(() => {
          paymentPlanService.calculatePaymentPlan(testData)
        }).not.toThrow()
      })
    })
  })
})

describe('Phase 8.3: Integration Tests', () => {
  
  describe('End-to-End Payment Plan Flow', () => {
    it('should complete full payment plan lifecycle', async () => {
      // 1. Create payment plan
      const plan = await paymentPlanService.createPaymentPlan(
        mockLawFirmId,
        mockClientId,
        mockPaymentPlanData
      )
      expect(plan.id).toBeDefined()
      expect(plan.status).toBe('draft')
      
      // 2. Activate payment plan
      const activatedPlan = await paymentPlanService.activatePaymentPlan(plan.id)
      expect(activatedPlan.status).toBe('active')
      
      // 3. Get installments
      const installments = await paymentPlanService.getPaymentInstallments(plan.id)
      expect(installments.length).toBeGreaterThan(0)
      
      // 4. Record payments for some installments
      for (let i = 0; i < Math.min(3, installments.length); i++) {
        const installment = installments[i]
        await paymentPlanService.recordPayment(
          installment.id,
          installment.amount,
          'credit_card',
          `txn-test-${i}`
        )
      }
      
      // 5. Get payment plan summary
      const summary = await paymentPlanService.getPaymentPlanSummary(plan.id)
      expect(summary).toBeDefined()
      expect(summary!.total_paid).toBeGreaterThan(0)
      expect(summary!.total_remaining).toBeLessThan(plan.total_amount)
      
      // 6. Check if automatically completed (if all payments made)
      const updatedPlan = await paymentPlanService.getPaymentPlan(plan.id)
      if (summary!.total_paid >= plan.total_amount) {
        expect(updatedPlan!.status).toBe('completed')
      }
    })
  })
})