// =====================================================
// CREATE SUBSCRIPTION API ROUTE
// Handle subscription creation with Stripe
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { stripeService } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      customer_email, 
      customer_name, 
      customer_phone,
      cpf_cnpj,
      price_id, 
      trial_period_days,
      law_firm_id,
      client_id,
      subscription_id
    } = body

    // Validate required fields
    if (!customer_email || !price_id || !law_firm_id || !client_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create or get Stripe customer
    const customer = await stripeService.createOrGetCustomer({
      email: customer_email,
      name: customer_name,
      phone: customer_phone,
      cpf_cnpj,
      law_firm_id,
      client_id
    })

    // Create subscription
    const subscription = await stripeService.createSubscription({
      customer_id: customer.id,
      price_id,
      trial_period_days,
      law_firm_id,
      client_id,
      subscription_id
    })

    return NextResponse.json({
      subscription_id: subscription.id,
      customer_id: customer.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      trial_end: subscription.trial_end,
      client_secret: subscription.latest_invoice?.payment_intent?.client_secret
    })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}