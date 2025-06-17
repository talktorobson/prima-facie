// =====================================================
// PRODUCTION CASE BILLING SERVICE LAYER
// Real Supabase Integration for Case Billing Management
// =====================================================

import { createClient } from '@/lib/supabase/client'
import {
  CaseType,
  CaseTypeFormData,
  CaseBillingMethod,
  CaseBillingMethodFormData,
  CaseOutcome,
  CaseOutcomeFormData,
  CaseBillingCalculationInput,
  CaseBillingCalculationResult,
  BillingCalculationBreakdown,
  SuccessFeeInvoice,
  BusinessParameter,
  BillingMethod,
  CaseOutcomeType,
  DEFAULT_BILLING_RATES,
  DEFAULT_SUCCESS_FEE_RATES,
  DEFAULT_MINIMUM_FEES
} from './case-billing-types'

import { productionDiscountService } from './discount-service-production'
import { DiscountCalculationInput } from './discount-types'

export class ProductionCaseBillingService {
  private supabase = createClient()

  // ===== CASE TYPE MANAGEMENT =====

  async getCaseTypes(lawFirmId: string): Promise<CaseType[]> {
    try {
      const { data, error } = await this.supabase
        .from('case_types')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        console.error('Error fetching case types:', error)
        throw new Error('Failed to fetch case types')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching case types:', error)
      throw error
    }
  }

  async getCaseType(caseTypeId: string): Promise<CaseType | null> {
    try {
      const { data, error } = await this.supabase
        .from('case_types')
        .select('*')
        .eq('id', caseTypeId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching case type:', error)
        throw new Error('Failed to fetch case type')
      }

      return data || null
    } catch (error) {
      console.error('Error fetching case type:', error)
      throw error
    }
  }

  async createCaseType(lawFirmId: string, formData: CaseTypeFormData): Promise<CaseType> {
    try {
      this.validateCaseTypeData(formData)

      const { data: newCaseType, error } = await this.supabase
        .from('case_types')
        .insert({
          law_firm_id: lawFirmId,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !newCaseType) {
        console.error('Error creating case type:', error)
        throw new Error('Failed to create case type')
      }

      return newCaseType
    } catch (error) {
      console.error('Error creating case type:', error)
      throw error
    }
  }

  async updateCaseType(caseTypeId: string, formData: Partial<CaseTypeFormData>): Promise<CaseType> {
    try {
      const { data: updatedCaseType, error } = await this.supabase
        .from('case_types')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseTypeId)
        .select()
        .single()

      if (error || !updatedCaseType) {
        console.error('Error updating case type:', error)
        throw new Error('Failed to update case type')
      }

      return updatedCaseType
    } catch (error) {
      console.error('Error updating case type:', error)
      throw error
    }
  }

  async deleteCaseType(caseTypeId: string): Promise<void> {
    try {
      // Check if case type is used in any matters
      const { data: mattersUsingType } = await this.supabase
        .from('matters')
        .select('id')
        .eq('case_type_id', caseTypeId)
        .limit(1)

      if (mattersUsingType && mattersUsingType.length > 0) {
        throw new Error('Cannot delete case type that is being used in matters')
      }

      // Soft delete
      const { error } = await this.supabase
        .from('case_types')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', caseTypeId)

      if (error) {
        console.error('Error deleting case type:', error)
        throw new Error('Failed to delete case type')
      }
    } catch (error) {
      console.error('Error deleting case type:', error)
      throw error
    }
  }

  // ===== CASE BILLING METHODS =====

  async getCaseBillingMethods(caseTypeId: string): Promise<CaseBillingMethod[]> {
    try {
      const { data, error } = await this.supabase
        .from('case_billing_methods')
        .select('*')
        .eq('case_type_id', caseTypeId)
        .eq('is_active', true)
        .order('priority')

      if (error) {
        console.error('Error fetching case billing methods:', error)
        throw new Error('Failed to fetch case billing methods')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching case billing methods:', error)
      throw error
    }
  }

  async createCaseBillingMethod(formData: CaseBillingMethodFormData): Promise<CaseBillingMethod> {
    try {
      const { data: newMethod, error } = await this.supabase
        .from('case_billing_methods')
        .insert({
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !newMethod) {
        console.error('Error creating case billing method:', error)
        throw new Error('Failed to create case billing method')
      }

      return newMethod
    } catch (error) {
      console.error('Error creating case billing method:', error)
      throw error
    }
  }

  // ===== CASE OUTCOME MANAGEMENT =====

  async getCaseOutcomes(matterId: string): Promise<CaseOutcome[]> {
    try {
      const { data, error } = await this.supabase
        .from('case_outcomes')
        .select('*')
        .eq('matter_id', matterId)
        .order('outcome_date', { ascending: false })

      if (error) {
        console.error('Error fetching case outcomes:', error)
        throw new Error('Failed to fetch case outcomes')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching case outcomes:', error)
      throw error
    }
  }

  async createCaseOutcome(formData: CaseOutcomeFormData): Promise<CaseOutcome> {
    try {
      // Calculate success percentage if not provided
      if (!formData.success_percentage && formData.amount_recovered && formData.amount_claimed) {
        formData.success_percentage = Math.min(
          (formData.amount_recovered / formData.amount_claimed) * 100,
          100
        )
      }

      const { data: newOutcome, error } = await this.supabase
        .from('case_outcomes')
        .insert({
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !newOutcome) {
        console.error('Error creating case outcome:', error)
        throw new Error('Failed to create case outcome')
      }

      return newOutcome
    } catch (error) {
      console.error('Error creating case outcome:', error)
      throw error
    }
  }

  // ===== BILLING CALCULATIONS =====

  async calculateCaseBilling(input: CaseBillingCalculationInput): Promise<CaseBillingCalculationResult> {
    try {
      // Get case type information
      const caseType = await this.getCaseType(input.case_type_id)
      if (!caseType) {
        throw new Error('Case type not found')
      }

      // Get billing methods for this case type
      const billingMethods = await this.getCaseBillingMethods(input.case_type_id)
      
      // Calculate base amounts for each billing method
      const calculations: BillingCalculationBreakdown[] = []

      for (const method of billingMethods) {
        const baseAmount = this.calculateBaseAmount(method, input)
        let finalAmount = baseAmount

        // Apply discounts if applicable
        if (input.apply_discounts && input.client_subscription_id) {
          try {
            const discountInput: DiscountCalculationInput = {
              client_subscription_id: input.client_subscription_id,
              service_type: 'case_billing',
              base_amount: baseAmount,
              case_type: caseType.legal_area || '',
              case_value: input.case_value || 0
            }
            
            const discountResult = await productionDiscountService.calculateDiscount(discountInput)
            finalAmount = discountResult.final_amount
          } catch (discountError) {
            console.warn('Error calculating discounts:', discountError)
          }
        }

        // Enforce minimum fee
        if (caseType.minimum_fee && finalAmount < caseType.minimum_fee) {
          finalAmount = caseType.minimum_fee
        }

        calculations.push({
          billing_method: method.billing_method,
          base_amount: baseAmount,
          discount_amount: baseAmount - finalAmount,
          minimum_fee_applied: finalAmount === caseType.minimum_fee,
          final_amount: finalAmount,
          calculation_details: {
            hours_worked: input.hours_worked || 0,
            hourly_rate: method.hourly_rate || 0,
            flat_fee: method.flat_fee || 0,
            contingency_percentage: method.contingency_percentage || 0,
            success_fee_percentage: method.success_fee_percentage || 0,
            case_value: input.case_value || 0,
            outcome_amount: input.outcome_amount || 0
          }
        })
      }

      // Determine recommended billing method
      const recommended = this.determineRecommendedBilling(calculations, input)

      return {
        case_type_id: input.case_type_id,
        case_type_name: caseType.name,
        calculations,
        recommended_method: recommended.billing_method,
        recommended_amount: recommended.final_amount,
        total_discount_applied: calculations.reduce((sum, calc) => sum + calc.discount_amount, 0),
        minimum_fee_enforced: calculations.some(calc => calc.minimum_fee_applied),
        calculation_date: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error calculating case billing:', error)
      throw error
    }
  }

  // ===== SUCCESS FEE PROCESSING =====

  async processSuccessFeeInvoice(
    matterId: string,
    outcomeId: string,
    billingMethodId: string
  ): Promise<SuccessFeeInvoice> {
    try {
      // Get case outcome details
      const { data: outcome, error: outcomeError } = await this.supabase
        .from('case_outcomes')
        .select('*')
        .eq('id', outcomeId)
        .single()

      if (outcomeError || !outcome) {
        throw new Error('Case outcome not found')
      }

      // Get billing method details
      const { data: method, error: methodError } = await this.supabase
        .from('case_billing_methods')
        .select('*')
        .eq('id', billingMethodId)
        .single()

      if (methodError || !method) {
        throw new Error('Billing method not found')
      }

      // Calculate success fee
      const successFeeAmount = this.calculateSuccessFee(outcome, method)

      // Create success fee invoice record
      const { data: invoice, error: invoiceError } = await this.supabase
        .from('success_fee_invoices')
        .insert({
          matter_id: matterId,
          case_outcome_id: outcomeId,
          billing_method_id: billingMethodId,
          success_fee_amount: successFeeAmount,
          outcome_amount: outcome.amount_recovered || 0,
          success_percentage: outcome.success_percentage || 0,
          calculation_details: {
            method: method.billing_method,
            rate: method.success_fee_percentage || method.contingency_percentage,
            base_amount: outcome.amount_recovered
          },
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (invoiceError || !invoice) {
        throw new Error('Failed to create success fee invoice')
      }

      return invoice
    } catch (error) {
      console.error('Error processing success fee invoice:', error)
      throw error
    }
  }

  // ===== BUSINESS PARAMETERS =====

  async getBusinessParameters(lawFirmId: string): Promise<BusinessParameter[]> {
    try {
      const { data, error } = await this.supabase
        .from('business_parameters')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .eq('is_active', true)

      if (error) {
        console.error('Error fetching business parameters:', error)
        throw new Error('Failed to fetch business parameters')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching business parameters:', error)
      throw error
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private validateCaseTypeData(formData: CaseTypeFormData): void {
    if (!formData.name || formData.name.length < 3) {
      throw new Error('Case type name must be at least 3 characters long')
    }

    if (formData.minimum_fee && formData.minimum_fee < 0) {
      throw new Error('Minimum fee cannot be negative')
    }

    if (formData.default_hourly_rate && formData.default_hourly_rate < 0) {
      throw new Error('Default hourly rate cannot be negative')
    }

    if (formData.default_contingency_percentage && 
        (formData.default_contingency_percentage < 0 || formData.default_contingency_percentage > 100)) {
      throw new Error('Contingency percentage must be between 0 and 100')
    }
  }

  private calculateBaseAmount(method: CaseBillingMethod, input: CaseBillingCalculationInput): number {
    switch (method.billing_method) {
      case 'hourly':
        return (input.hours_worked || 0) * (method.hourly_rate || 0)
      
      case 'flat_fee':
        return method.flat_fee || 0
      
      case 'contingency':
        return ((input.outcome_amount || 0) * (method.contingency_percentage || 0)) / 100
      
      case 'hybrid':
        const hourlyAmount = (input.hours_worked || 0) * (method.hourly_rate || 0)
        const successAmount = ((input.outcome_amount || 0) * (method.success_fee_percentage || 0)) / 100
        return hourlyAmount + successAmount
      
      default:
        return 0
    }
  }

  private calculateSuccessFee(outcome: CaseOutcome, method: CaseBillingMethod): number {
    const baseAmount = outcome.amount_recovered || 0
    const feePercentage = method.success_fee_percentage || method.contingency_percentage || 0
    
    return (baseAmount * feePercentage) / 100
  }

  private determineRecommendedBilling(
    calculations: BillingCalculationBreakdown[],
    input: CaseBillingCalculationInput
  ): BillingCalculationBreakdown {
    // Default to the first calculation if no specific logic
    if (calculations.length === 0) {
      throw new Error('No billing calculations available')
    }

    // For now, recommend the method with the highest final amount
    // In production, this could be more sophisticated based on case characteristics
    return calculations.reduce((max, current) => 
      current.final_amount > max.final_amount ? current : max
    )
  }

  /**
   * Format currency for Brazilian market
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  /**
   * Calculate payment plan installments for case billing
   */
  async calculateInstallmentPlan(
    totalAmount: number,
    numberOfInstallments: number,
    interestRate: number = 0
  ): Promise<{ installment_amount: number; total_with_interest: number; schedule: any[] }> {
    const baseInstallment = totalAmount / numberOfInstallments
    const monthlyInterestRate = interestRate / 100 / 12
    
    let installmentAmount = baseInstallment
    let totalWithInterest = totalAmount

    // Apply interest if specified
    if (interestRate > 0) {
      installmentAmount = totalAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfInstallments)) / 
        (Math.pow(1 + monthlyInterestRate, numberOfInstallments) - 1)
      totalWithInterest = installmentAmount * numberOfInstallments
    }

    // Generate payment schedule
    const schedule = []
    const today = new Date()

    for (let i = 1; i <= numberOfInstallments; i++) {
      const dueDate = new Date(today)
      dueDate.setMonth(dueDate.getMonth() + i)

      schedule.push({
        installment_number: i,
        due_date: dueDate.toISOString().split('T')[0],
        amount: installmentAmount,
        status: 'pending'
      })
    }

    return {
      installment_amount: Math.round(installmentAmount * 100) / 100,
      total_with_interest: Math.round(totalWithInterest * 100) / 100,
      schedule
    }
  }
}

// Export singleton instance
export const productionCaseBillingService = new ProductionCaseBillingService()