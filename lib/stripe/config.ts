// =====================================================
// STRIPE CONFIGURATION
// Payment Processing Setup for Prima Facie
// =====================================================

import { loadStripe, Stripe } from '@stripe/stripe-js'

// Initialize Stripe on client side
let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Stripe configuration constants
export const STRIPE_CONFIG = {
  // Brazilian currency support
  currency: 'brl' as const,
  
  // Payment methods accepted in Brazil
  payment_methods: [
    'card',
    'pix',
    'boleto'
  ] as const,
  
  // Subscription intervals
  billing_intervals: {
    monthly: 'month',
    yearly: 'year'
  } as const,
  
  // Webhook events we handle
  webhook_events: [
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed'
  ] as const
}

// Price configuration for Brazilian market
export const PRICE_CONFIG = {
  // Minimum amounts in centavos (BRL)
  minimum_amount: 100, // R$ 1,00
  
  // Subscription setup
  trial_period_days: 14,
  
  // Payment timing
  collection_method: 'charge_automatically' as const,
  
  // Invoice settings
  days_until_due: 7
}