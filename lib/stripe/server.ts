// =====================================================
// STRIPE SERVER-SIDE SERVICE
// Server-side Stripe operations for Prima Facie
// =====================================================

import Stripe from 'stripe'
import { STRIPE_CONFIG, PRICE_CONFIG } from './config'

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})

export class StripeService {
  
  // =====================================================
  // CUSTOMER MANAGEMENT
  // =====================================================
  
  /**
   * Create or retrieve Stripe customer
   */
  async createOrGetCustomer(params: {
    email: string
    name: string
    phone?: string
    cpf_cnpj?: string
    law_firm_id: string
    client_id: string
  }): Promise<Stripe.Customer> {
    try {
      // Check if customer already exists
      const existingCustomers = await stripe.customers.list({
        email: params.email,
        limit: 1
      })
      
      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0]
      }
      
      // Create new customer
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: {
          law_firm_id: params.law_firm_id,
          client_id: params.client_id,
          cpf_cnpj: params.cpf_cnpj || '',
          source: 'prima_facie'
        }
      })
      
      return customer
    } catch (error) {
      console.error('Error creating/getting Stripe customer:', error)
      throw error
    }
  }
  
  // =====================================================
  // SUBSCRIPTION MANAGEMENT
  // =====================================================
  
  /**
   * Create subscription plan (Stripe Product + Price)
   */
  async createSubscriptionPlan(params: {
    name: string
    description: string
    monthly_amount: number
    yearly_amount?: number
    law_firm_id: string
    plan_id: string
  }): Promise<{ product: Stripe.Product; monthly_price: Stripe.Price; yearly_price?: Stripe.Price }> {
    try {
      // Create product
      const product = await stripe.products.create({
        name: params.name,
        description: params.description,
        metadata: {
          law_firm_id: params.law_firm_id,
          plan_id: params.plan_id,
          source: 'prima_facie'
        }
      })
      
      // Create monthly price
      const monthly_price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(params.monthly_amount * 100), // Convert to centavos
        currency: STRIPE_CONFIG.currency,
        recurring: {
          interval: 'month',
          interval_count: 1
        },
        metadata: {
          billing_interval: 'monthly',
          law_firm_id: params.law_firm_id,
          plan_id: params.plan_id
        }
      })
      
      let yearly_price: Stripe.Price | undefined
      
      // Create yearly price if provided
      if (params.yearly_amount) {
        yearly_price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(params.yearly_amount * 100), // Convert to centavos
          currency: STRIPE_CONFIG.currency,
          recurring: {
            interval: 'year',
            interval_count: 1
          },
          metadata: {
            billing_interval: 'yearly',
            law_firm_id: params.law_firm_id,
            plan_id: params.plan_id
          }
        })
      }
      
      return { product, monthly_price, yearly_price }
    } catch (error) {
      console.error('Error creating subscription plan:', error)
      throw error
    }
  }
  
  /**
   * Create subscription for customer
   */
  async createSubscription(params: {
    customer_id: string
    price_id: string
    trial_period_days?: number
    law_firm_id: string
    client_id: string
    subscription_id: string
  }): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: params.customer_id,
        items: [{ price: params.price_id }],
        trial_period_days: params.trial_period_days || PRICE_CONFIG.trial_period_days,
        collection_method: PRICE_CONFIG.collection_method,
        days_until_due: PRICE_CONFIG.days_until_due,
        metadata: {
          law_firm_id: params.law_firm_id,
          client_id: params.client_id,
          subscription_id: params.subscription_id,
          source: 'prima_facie'
        },
        expand: ['latest_invoice.payment_intent']
      })
      
      return subscription
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw error
    }
  }
  
  /**
   * Cancel subscription
   */
  async cancelSubscription(stripe_subscription_id: string): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(stripe_subscription_id, {
        cancel_at_period_end: true
      })
      
      return subscription
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }
  
  // =====================================================
  // ONE-TIME PAYMENTS (CASE BILLING)
  // =====================================================
  
  /**
   * Create payment intent for case billing
   */
  async createCasePaymentIntent(params: {
    amount: number
    customer_id: string
    description: string
    case_id: string
    invoice_id: string
    law_firm_id: string
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to centavos
        currency: STRIPE_CONFIG.currency,
        customer: params.customer_id,
        description: params.description,
        payment_method_types: ['card', 'pix'],
        metadata: {
          type: 'case_payment',
          case_id: params.case_id,
          invoice_id: params.invoice_id,
          law_firm_id: params.law_firm_id,
          source: 'prima_facie'
        }
      })
      
      return paymentIntent
    } catch (error) {
      console.error('Error creating case payment intent:', error)
      throw error
    }
  }
  
  /**
   * Create payment intent for installment
   */
  async createInstallmentPaymentIntent(params: {
    amount: number
    customer_id: string
    description: string
    installment_number: number
    total_installments: number
    payment_plan_id: string
    law_firm_id: string
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to centavos
        currency: STRIPE_CONFIG.currency,
        customer: params.customer_id,
        description: `${params.description} (${params.installment_number}/${params.total_installments})`,
        payment_method_types: ['card', 'pix'],
        metadata: {
          type: 'installment_payment',
          payment_plan_id: params.payment_plan_id,
          installment_number: params.installment_number.toString(),
          total_installments: params.total_installments.toString(),
          law_firm_id: params.law_firm_id,
          source: 'prima_facie'
        }
      })
      
      return paymentIntent
    } catch (error) {
      console.error('Error creating installment payment intent:', error)
      throw error
    }
  }
  
  // =====================================================
  // WEBHOOK HANDLING
  // =====================================================
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
      
      return event
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      throw error
    }
  }
  
  // =====================================================
  // UTILITY METHODS
  // =====================================================
  
  /**
   * Format amount from centavos to BRL
   */
  formatAmount(centavos: number): number {
    return centavos / 100
  }
  
  /**
   * Format amount to centavos
   */
  toCentavos(amount: number): number {
    return Math.round(amount * 100)
  }
  
  /**
   * Get payment method for PIX
   */
  async createPixPaymentMethod(customer_id: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.create({
        type: 'pix',
        pix: {}
      })
      
      await stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customer_id
      })
      
      return paymentMethod
    } catch (error) {
      console.error('Error creating PIX payment method:', error)
      throw error
    }
  }
}

// Export singleton instance
export const stripeService = new StripeService()