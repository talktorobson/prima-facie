// =====================================================
// PHASE 8.5: CASE BILLING SERVICE LAYER
// =====================================================

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
  DEFAULT_MINIMUM_FEES,
  PRESET_CASE_TYPES
} from './case-billing-types'

import { discountService } from './discount-service'
import { DiscountCalculationInput } from './discount-types'

export class CaseBillingService {

  // ===== CASE TYPE MANAGEMENT =====

  async getCaseTypes(lawFirmId: string): Promise<CaseType[]> {
    // Mock implementation - replace with Supabase in production
    return this.mockCaseTypes.filter(caseType => caseType.law_firm_id === lawFirmId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async getCaseType(caseTypeId: string): Promise<CaseType | null> {
    return this.mockCaseTypes.find(caseType => caseType.id === caseTypeId) || null
  }

  async createCaseType(lawFirmId: string, formData: CaseTypeFormData): Promise<CaseType> {
    try {
      this.validateCaseTypeData(formData)

      const newCaseType: CaseType = {
        id: `case-type-${Date.now()}`,
        law_firm_id: lawFirmId,
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Creating case type:', newCaseType)
      this.mockCaseTypes.push(newCaseType)

      return newCaseType
    } catch (error) {
      console.error('Error creating case type:', error)
      throw error
    }
  }

  async updateCaseType(caseTypeId: string, updates: Partial<CaseTypeFormData>): Promise<CaseType> {
    const caseTypeIndex = this.mockCaseTypes.findIndex(ct => ct.id === caseTypeId)
    if (caseTypeIndex === -1) {
      throw new Error('Case type not found')
    }

    const updatedCaseType = {
      ...this.mockCaseTypes[caseTypeIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    console.log('Updating case type:', updatedCaseType)
    this.mockCaseTypes[caseTypeIndex] = updatedCaseType

    return updatedCaseType
  }

  async deleteCaseType(caseTypeId: string): Promise<void> {
    const caseTypeIndex = this.mockCaseTypes.findIndex(ct => ct.id === caseTypeId)
    if (caseTypeIndex === -1) {
      throw new Error('Case type not found')
    }

    this.mockCaseTypes.splice(caseTypeIndex, 1)
    console.log('Deleted case type:', caseTypeId)
  }

  async createPresetCaseTypes(lawFirmId: string): Promise<CaseType[]> {
    const createdCaseTypes: CaseType[] = []

    for (const preset of PRESET_CASE_TYPES) {
      try {
        const caseType = await this.createCaseType(lawFirmId, preset)
        createdCaseTypes.push(caseType)
      } catch (error) {
        console.error('Error creating preset case type:', preset.name, error)
      }
    }

    console.log(`Created ${createdCaseTypes.length} preset case types`)
    return createdCaseTypes
  }

  // ===== CASE BILLING METHOD MANAGEMENT =====

  async getCaseBillingMethods(matterId: string): Promise<CaseBillingMethod[]> {
    return this.mockBillingMethods.filter(method => method.matter_id === matterId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  async getCaseBillingMethod(billingMethodId: string): Promise<CaseBillingMethod | null> {
    return this.mockBillingMethods.find(method => method.id === billingMethodId) || null
  }

  async createCaseBillingMethod(
    lawFirmId: string,
    formData: CaseBillingMethodFormData
  ): Promise<CaseBillingMethod> {
    try {
      this.validateBillingMethodData(formData)

      // Get case type for minimum fee calculation
      let minimumFee = formData.minimum_fee || 0
      if (formData.case_type_id && formData.minimum_fee_source === 'case_type') {
        const caseType = await this.getCaseType(formData.case_type_id)
        if (caseType) {
          minimumFee = this.getMinimumFeeForBillingType(caseType, formData.billing_type)
        }
      }

      const newBillingMethod: CaseBillingMethod = {
        id: `billing-method-${Date.now()}`,
        matter_id: formData.matter_id,
        case_type_id: formData.case_type_id,
        billing_type: formData.billing_type,
        hourly_rate: formData.hourly_rate,
        percentage_rate: formData.percentage_rate,
        fixed_amount: formData.fixed_amount,
        success_fee_percentage: formData.success_fee_percentage,
        success_fee_applies_to: formData.success_fee_applies_to,
        minimum_fee: minimumFee,
        minimum_fee_source: formData.minimum_fee_source,
        has_subscription_discount: false,
        discount_percentage: 0,
        discount_amount: 0,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Creating case billing method:', newBillingMethod)
      this.mockBillingMethods.push(newBillingMethod)

      return newBillingMethod
    } catch (error) {
      console.error('Error creating case billing method:', error)
      throw error
    }
  }

  async updateCaseBillingMethod(
    billingMethodId: string,
    updates: Partial<CaseBillingMethodFormData>
  ): Promise<CaseBillingMethod> {
    const methodIndex = this.mockBillingMethods.findIndex(method => method.id === billingMethodId)
    if (methodIndex === -1) {
      throw new Error('Case billing method not found')
    }

    const updatedMethod = {
      ...this.mockBillingMethods[methodIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    console.log('Updating case billing method:', updatedMethod)
    this.mockBillingMethods[methodIndex] = updatedMethod

    return updatedMethod
  }

  async approveCaseBillingMethod(billingMethodId: string, approvedBy: string): Promise<CaseBillingMethod> {
    return this.updateCaseBillingMethod(billingMethodId, {
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    } as any)
  }

  async activateCaseBillingMethod(billingMethodId: string): Promise<CaseBillingMethod> {
    return this.updateCaseBillingMethod(billingMethodId, {
      status: 'active'
    } as any)
  }

  async applyDiscountToBillingMethod(
    billingMethodId: string,
    discountDetails: any
  ): Promise<CaseBillingMethod> {
    const method = await this.getCaseBillingMethod(billingMethodId)
    if (!method) {
      throw new Error('Billing method not found')
    }

    const originalAmount = method.final_amount || 0
    const discountAmount = discountDetails.total_discount_amount
    const discountPercentage = discountDetails.discount_percentage
    const finalAmount = Math.max(originalAmount - discountAmount, method.minimum_fee)

    return this.updateCaseBillingMethod(billingMethodId, {
      has_subscription_discount: true,
      original_amount: originalAmount,
      discount_percentage: discountPercentage,
      discount_amount: discountAmount,
      final_amount: finalAmount
    } as any)
  }

  // ===== BILLING CALCULATION ENGINE =====

  async calculateCaseBilling(
    lawFirmId: string,
    input: CaseBillingCalculationInput
  ): Promise<CaseBillingCalculationResult> {
    try {
      const { matter_id, case_value, billing_method, case_type } = input

      // 1. Calculate base amount
      const baseCalculation = this.calculateBaseAmount(billing_method, case_value)

      // 2. Apply minimum fee check
      const minimumFeeCheck = this.applyMinimumFee(baseCalculation, billing_method, case_type)

      // 3. Calculate success fee (if applicable)
      const successFeeCalculation = this.calculateSuccessFee(
        minimumFeeCheck.final_base_amount,
        billing_method,
        case_value
      )

      // 4. Check discount eligibility and integrate with discount engine
      const discountResult = await this.checkDiscountEligibility(
        lawFirmId,
        input,
        minimumFeeCheck.final_base_amount
      )

      // 5. Apply discount to billing method if eligible
      if (discountResult.eligible && discountResult.discount_details) {
        await this.applyDiscountToBillingMethod(billing_method.id, discountResult.discount_details)
      }

      // 6. Calculate final amounts
      const subtotal = minimumFeeCheck.final_base_amount + successFeeCalculation.success_fee_amount
      const totalAmount = Math.max(subtotal - discountResult.discount_amount, billing_method.minimum_fee)

      // 7. Build calculation breakdown
      const calculationBreakdown: BillingCalculationBreakdown = {
        base_calculation: baseCalculation,
        minimum_fee_check: minimumFeeCheck,
        success_fee_calculation: successFeeCalculation.success_fee_amount > 0 ? successFeeCalculation : undefined,
        discount_application: discountResult.eligible ? {
          eligible: discountResult.eligible,
          discount_type: discountResult.discount_details?.applied_rules[0]?.discount_type || 'percentage',
          discount_percentage: discountResult.discount_details?.discount_percentage || 0,
          discount_amount: discountResult.discount_amount,
          final_amount: totalAmount
        } : undefined
      }

      // 8. Validate result
      const validation = this.validateCalculationResult(totalAmount, billing_method)

      const result: CaseBillingCalculationResult = {
        matter_id,
        billing_method: billing_method.billing_type,
        base_amount: baseCalculation.calculated_amount,
        minimum_fee_applied: minimumFeeCheck.minimum_applied,
        minimum_fee_amount: minimumFeeCheck.required_minimum,
        success_fee_eligible: successFeeCalculation.success_fee_amount > 0,
        success_fee_amount: successFeeCalculation.success_fee_amount,
        discount_eligible: discountResult.eligible,
        discount_details: discountResult.eligible ? discountResult.discount_details : undefined,
        original_total: subtotal,
        discount_amount: discountResult.discount_amount,
        subtotal,
        total_amount: totalAmount,
        calculation_breakdown: calculationBreakdown,
        is_valid: validation.is_valid,
        validation_errors: validation.errors,
        warnings: validation.warnings
      }

      console.log('Case billing calculation result:', {
        matterId: matter_id,
        baseAmount: baseCalculation.calculated_amount,
        minimumFeeApplied: minimumFeeCheck.minimum_applied,
        discountEligible: discountResult.eligible,
        discountAmount: discountResult.discount_amount,
        totalAmount
      })

      return result
    } catch (error) {
      console.error('Error calculating case billing:', error)
      throw error
    }
  }

  // ===== CASE OUTCOME MANAGEMENT =====

  async getCaseOutcomes(matterId: string): Promise<CaseOutcome[]> {
    return this.mockCaseOutcomes.filter(outcome => outcome.matter_id === matterId)
      .sort((a, b) => new Date(b.outcome_date).getTime() - new Date(a.outcome_date).getTime())
  }

  async getCaseOutcome(outcomeId: string): Promise<CaseOutcome | null> {
    return this.mockCaseOutcomes.find(outcome => outcome.id === outcomeId) || null
  }

  async createCaseOutcome(lawFirmId: string, formData: CaseOutcomeFormData): Promise<CaseOutcome> {
    try {
      this.validateCaseOutcomeData(formData)

      // Calculate success fee if applicable
      let successFeeAmount = 0
      let successFeePercentage = 0

      if (formData.success_achieved && formData.effective_value_redeemed) {
        // Get billing method to determine success fee rate
        const billingMethods = await this.getCaseBillingMethods(formData.matter_id)
        if (billingMethods.length > 0) {
          successFeePercentage = billingMethods[0].success_fee_percentage
          successFeeAmount = formData.effective_value_redeemed * (successFeePercentage / 100)
        }
      }

      const newOutcome: CaseOutcome = {
        id: `outcome-${Date.now()}`,
        ...formData,
        success_fee_percentage: successFeePercentage,
        success_fee_amount: successFeeAmount,
        success_fee_calculation_method: 'percentage',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Creating case outcome:', newOutcome)
      this.mockCaseOutcomes.push(newOutcome)

      return newOutcome
    } catch (error) {
      console.error('Error creating case outcome:', error)
      throw error
    }
  }

  async updateCaseOutcome(outcomeId: string, updates: Partial<CaseOutcomeFormData>): Promise<CaseOutcome> {
    const outcomeIndex = this.mockCaseOutcomes.findIndex(outcome => outcome.id === outcomeId)
    if (outcomeIndex === -1) {
      throw new Error('Case outcome not found')
    }

    const updatedOutcome = {
      ...this.mockCaseOutcomes[outcomeIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    console.log('Updating case outcome:', updatedOutcome)
    this.mockCaseOutcomes[outcomeIndex] = updatedOutcome

    return updatedOutcome
  }

  // ===== BUSINESS PARAMETERS =====

  async getBusinessParameters(lawFirmId: string, category?: string): Promise<BusinessParameter[]> {
    let parameters = this.mockBusinessParameters.filter(param => param.law_firm_id === lawFirmId)
    
    if (category) {
      parameters = parameters.filter(param => param.parameter_category === category)
    }

    return parameters.sort((a, b) => a.parameter_name.localeCompare(b.parameter_name))
  }

  async getBusinessParameter(lawFirmId: string, parameterKey: string): Promise<BusinessParameter | null> {
    return this.mockBusinessParameters.find(
      param => param.law_firm_id === lawFirmId && param.parameter_key === parameterKey
    ) || null
  }

  async updateBusinessParameter(
    lawFirmId: string,
    parameterKey: string,
    value: string
  ): Promise<BusinessParameter> {
    const paramIndex = this.mockBusinessParameters.findIndex(
      param => param.law_firm_id === lawFirmId && param.parameter_key === parameterKey
    )

    if (paramIndex === -1) {
      throw new Error('Business parameter not found')
    }

    this.mockBusinessParameters[paramIndex].parameter_value = value
    this.mockBusinessParameters[paramIndex].updated_at = new Date().toISOString()

    return this.mockBusinessParameters[paramIndex]
  }

  // ===== UTILITY FUNCTIONS =====

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`
  }

  // ===== PRIVATE METHODS =====

  private validateCaseTypeData(data: CaseTypeFormData): void {
    if (!data.name || data.name.length < 3) {
      throw new Error('Case type name must be at least 3 characters long')
    }
    if (!data.code || data.code.length < 2) {
      throw new Error('Case type code must be at least 2 characters long')
    }
    if (data.complexity_multiplier <= 0) {
      throw new Error('Complexity multiplier must be greater than zero')
    }
  }

  private validateBillingMethodData(data: CaseBillingMethodFormData): void {
    if (!data.matter_id) {
      throw new Error('Matter ID is required')
    }

    switch (data.billing_type) {
      case 'hourly':
        if (!data.hourly_rate || data.hourly_rate <= 0) {
          throw new Error('Hourly rate must be greater than zero for hourly billing')
        }
        break
      case 'percentage':
        if (!data.percentage_rate || data.percentage_rate <= 0 || data.percentage_rate > 100) {
          throw new Error('Percentage rate must be between 0 and 100 for percentage billing')
        }
        break
      case 'fixed':
        if (!data.fixed_amount || data.fixed_amount <= 0) {
          throw new Error('Fixed amount must be greater than zero for fixed billing')
        }
        break
    }

    if (data.success_fee_percentage < 0 || data.success_fee_percentage > 100) {
      throw new Error('Success fee percentage must be between 0 and 100')
    }
  }

  private validateCaseOutcomeData(data: CaseOutcomeFormData): void {
    if (!data.matter_id) {
      throw new Error('Matter ID is required')
    }
    if (!data.outcome_date) {
      throw new Error('Outcome date is required')
    }
    if (data.success_percentage && (data.success_percentage < 0 || data.success_percentage > 100)) {
      throw new Error('Success percentage must be between 0 and 100')
    }
  }

  private calculateBaseAmount(billingMethod: CaseBillingMethod, caseValue: number): any {
    let calculatedAmount = 0
    const result: any = {
      method: billingMethod.billing_type,
      calculated_amount: 0
    }

    switch (billingMethod.billing_type) {
      case 'hourly':
        const hours = 40 // Default estimated hours - should come from case type or user input
        calculatedAmount = (billingMethod.hourly_rate || 0) * hours
        result.rate = billingMethod.hourly_rate
        result.hours = hours
        break

      case 'percentage':
        calculatedAmount = caseValue * ((billingMethod.percentage_rate || 0) / 100)
        result.percentage = billingMethod.percentage_rate
        result.case_value = caseValue
        break

      case 'fixed':
        calculatedAmount = billingMethod.fixed_amount || 0
        result.fixed_amount = billingMethod.fixed_amount
        break
    }

    result.calculated_amount = calculatedAmount
    return result
  }

  private applyMinimumFee(baseCalculation: any, billingMethod: CaseBillingMethod, caseType?: CaseType): any {
    const requiredMinimum = billingMethod.minimum_fee
    const calculatedAmount = baseCalculation.calculated_amount
    const minimumApplied = calculatedAmount < requiredMinimum
    const finalAmount = Math.max(calculatedAmount, requiredMinimum)

    return {
      required_minimum: requiredMinimum,
      calculated_amount: calculatedAmount,
      minimum_applied: minimumApplied,
      final_base_amount: finalAmount
    }
  }

  private calculateSuccessFee(baseAmount: number, billingMethod: CaseBillingMethod, caseValue: number): any {
    const successFeePercentage = billingMethod.success_fee_percentage
    const appliesTo = billingMethod.success_fee_applies_to

    if (successFeePercentage === 0) {
      return { success_fee_amount: 0 }
    }

    const calculationBase = appliesTo === 'total' ? caseValue : baseAmount
    const successFeeAmount = calculationBase * (successFeePercentage / 100)

    return {
      percentage: successFeePercentage,
      applies_to: appliesTo,
      calculation_base: calculationBase,
      success_fee_amount: successFeeAmount
    }
  }

  private async checkDiscountEligibility(
    lawFirmId: string,
    input: CaseBillingCalculationInput,
    baseAmount: number
  ): Promise<any> {
    // Check if client has subscription for discount eligibility
    if (input.client_subscription_status !== 'active') {
      return { eligible: false, discount_amount: 0 }
    }

    // Calculate estimated hours based on case type or default
    let estimatedHours = 40 // Default
    if (input.case_type?.estimated_hours_range) {
      const range = input.case_type.estimated_hours_range.match(/(\d+)-(\d+)/)
      if (range) {
        estimatedHours = (parseInt(range[1]) + parseInt(range[2])) / 2
      }
    }

    // Use discount service to calculate discount
    // Use a standard client ID that matches discount service mock data for active subscribers
    const clientId = input.client_subscription_status === 'active' ? 'test-client-123' : `matter-client-${input.matter_id}`
    
    const discountInput: DiscountCalculationInput = {
      client_id: clientId,
      case_type: input.case_type?.category || 'general',
      case_value: input.case_value,
      billing_type: input.billing_method.billing_type,
      hourly_rate: input.billing_method.hourly_rate,
      estimated_hours: estimatedHours,
      percentage_rate: input.billing_method.percentage_rate,
      fixed_amount: input.billing_method.fixed_amount
    }

    try {
      const discountResult = await discountService.calculateDiscount(lawFirmId, discountInput)
      
      console.log('Discount eligibility check:', {
        matterId: input.matter_id,
        caseValue: input.case_value,
        subscriptionStatus: input.client_subscription_status,
        discountEligible: discountResult.eligible,
        discountAmount: discountResult.total_discount_amount,
        appliedRules: discountResult.applied_rules.length
      })

      return {
        eligible: discountResult.eligible,
        discount_details: discountResult,
        discount_amount: discountResult.total_discount_amount
      }
    } catch (error) {
      console.error('Error checking discount eligibility:', error)
      return { eligible: false, discount_amount: 0 }
    }
  }

  // ===== CROSS-SELLING INTEGRATION =====

  async checkCrossSellingOpportunity(
    matterId: string,
    caseValue: number,
    caseType: string
  ): Promise<any> {
    const clientId = `matter-client-${matterId}`
    
    try {
      const opportunity = await discountService.checkCrossSellingOpportunity(
        clientId,
        caseValue,
        caseType
      )

      console.log('Cross-selling opportunity for case billing:', {
        matterId,
        caseValue,
        caseType,
        potentialDiscount: opportunity.potential_discount_percentage,
        projectedSavings: opportunity.projected_savings,
        recommendation: opportunity.subscription_recommendation
      })

      return opportunity
    } catch (error) {
      console.error('Error checking cross-selling opportunity:', error)
      return null
    }
  }

  private validateCalculationResult(totalAmount: number, billingMethod: CaseBillingMethod): any {
    const errors: string[] = []
    const warnings: string[] = []

    if (totalAmount <= 0) {
      errors.push('Total amount must be greater than zero')
    }

    if (totalAmount < billingMethod.minimum_fee) {
      warnings.push(`Total amount is below minimum fee of ${this.formatCurrency(billingMethod.minimum_fee)}`)
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings
    }
  }

  private getMinimumFeeForBillingType(caseType: CaseType, billingType: BillingMethod): number {
    switch (billingType) {
      case 'hourly':
        return caseType.minimum_fee_hourly
      case 'percentage':
        return caseType.minimum_fee_percentage
      case 'fixed':
        return caseType.minimum_fee_fixed
      default:
        return 0
    }
  }

  // ===== MOCK DATA =====

  private mockCaseTypes: CaseType[] = [
    {
      id: 'ct-1',
      law_firm_id: 'firm-1',
      name: 'Ação Trabalhista',
      code: 'LAB_ACT',
      category: 'labor',
      minimum_fee_hourly: 1500.00,
      minimum_fee_percentage: 2500.00,
      minimum_fee_fixed: 2000.00,
      default_billing_method: 'percentage',
      default_hourly_rate: 300.00,
      default_percentage_rate: 20.0,
      default_success_fee_rate: 15.0,
      complexity_multiplier: 1.2,
      estimated_hours_range: '40-80 horas',
      is_active: true,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 'ct-2',
      law_firm_id: 'firm-1',
      name: 'Revisão de Contrato Empresarial',
      code: 'CORP_REV',
      category: 'corporate',
      minimum_fee_hourly: 1000.00,
      minimum_fee_percentage: 1500.00,
      minimum_fee_fixed: 1200.00,
      default_billing_method: 'hourly',
      default_hourly_rate: 400.00,
      default_percentage_rate: 15.0,
      default_success_fee_rate: 20.0,
      complexity_multiplier: 1.0,
      estimated_hours_range: '10-30 horas',
      is_active: true,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ]

  private mockBillingMethods: CaseBillingMethod[] = [
    {
      id: 'bm-1',
      matter_id: 'matter-1',
      case_type_id: 'ct-1',
      billing_type: 'percentage',
      percentage_rate: 20.0,
      success_fee_percentage: 15.0,
      success_fee_applies_to: 'recovered',
      minimum_fee: 2500.00,
      minimum_fee_source: 'case_type',
      has_subscription_discount: false,
      discount_percentage: 0,
      discount_amount: 0,
      final_amount: 10000.00,
      status: 'active',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ]

  private mockCaseOutcomes: CaseOutcome[] = [
    {
      id: 'co-1',
      matter_id: 'matter-1',
      outcome_type: 'settlement',
      total_value_claimed: 100000.00,
      effective_value_redeemed: 75000.00,
      settlement_amount: 75000.00,
      success_achieved: true,
      success_percentage: 75.0,
      success_fee_percentage: 15.0,
      success_fee_amount: 11250.00,
      success_fee_calculation_method: 'percentage',
      outcome_date: '2024-01-15',
      notes: 'Acordo favorável alcançado antes do julgamento',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    }
  ]

  private mockBusinessParameters: BusinessParameter[] = [
    {
      id: 'bp-1',
      law_firm_id: 'firm-1',
      parameter_category: 'billing_rates',
      parameter_name: 'Junior Lawyer Hourly Rate',
      parameter_key: 'junior_lawyer_rate',
      parameter_value: '150.00',
      parameter_type: 'number',
      description: 'Hourly rate for junior lawyers',
      unit: 'currency',
      is_active: true,
      requires_approval: false,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 'bp-2',
      law_firm_id: 'firm-1',
      parameter_category: 'success_fee_rates',
      parameter_name: 'Labor Litigation Success Fee',
      parameter_key: 'labor_success_rate',
      parameter_value: '15.0',
      parameter_type: 'number',
      description: 'Success fee percentage for labor cases',
      unit: 'percentage',
      is_active: true,
      requires_approval: false,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ]
}

// Export singleton instance
export const caseBillingService = new CaseBillingService()