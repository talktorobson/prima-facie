// =====================================================
// CREATE PAYMENT INTENT API ROUTE
// Handle one-time payments for case billing
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { stripeService } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      amount, 
      customer_email, 
      customer_name, 
      description, 
      case_id, 
      invoice_id, 
      law_firm_id,
      client_id,
      payment_type = 'case_payment'
    } = body

    // Validate required fields
    if (!amount || !customer_email || !description || !law_firm_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create or get Stripe customer
    const customer = await stripeService.createOrGetCustomer({
      email: customer_email,
      name: customer_name,
      law_firm_id,
      client_id
    })

    let paymentIntent

    if (payment_type === 'case_payment') {
      // Create payment intent for case billing
      paymentIntent = await stripeService.createCasePaymentIntent({
        amount,
        customer_id: customer.id,
        description,
        case_id,
        invoice_id,
        law_firm_id
      })
    } else if (payment_type === 'installment_payment') {
      // Create payment intent for installment
      const { installment_number, total_installments, payment_plan_id } = body
      
      paymentIntent = await stripeService.createInstallmentPaymentIntent({
        amount,
        customer_id: customer.id,
        description,
        installment_number,
        total_installments,
        payment_plan_id,
        law_firm_id
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}