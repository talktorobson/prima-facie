// =====================================================
// STRIPE WEBHOOK HANDLER
// Process Stripe payment events
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { stripeService } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { emailNotificationService } from '@/lib/notifications/email-service'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')
    
    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }
    
    // Verify webhook signature
    const event = stripeService.verifyWebhookSignature(body, signature)
    
    console.log(`Received Stripe webhook: ${event.type}`)
    
    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event)
        break
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event)
        break
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event)
        break
        
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event)
        break
        
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}

// =====================================================
// WEBHOOK EVENT HANDLERS
// =====================================================

async function handleSubscriptionCreated(event: any) {
  const subscription = event.data.object
  const supabase = createClient()
  
  try {
    // Update subscription status in database
    const { error } = await supabase
      .from('client_subscriptions')
      .update({
        stripe_subscription_id: subscription.id,
        status: 'active',
        stripe_customer_id: subscription.customer,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.metadata.subscription_id)
    
    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log('Subscription created successfully:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(event: any) {
  const subscription = event.data.object
  const supabase = createClient()
  
  try {
    // Update subscription details
    const { error } = await supabase
      .from('client_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
    
    if (error) {
      console.error('Error updating subscription:', error)
    } else {
      console.log('Subscription updated successfully:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(event: any) {
  const subscription = event.data.object
  const supabase = createClient()
  
  try {
    // Mark subscription as cancelled
    const { error } = await supabase
      .from('client_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)
    
    if (error) {
      console.error('Error cancelling subscription:', error)
    } else {
      console.log('Subscription cancelled successfully:', subscription.id)
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handleInvoicePaymentSucceeded(event: any) {
  const invoice = event.data.object
  const supabase = createClient()
  
  try {
    // Update invoice status
    const { error } = await supabase
      .from('subscription_invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_invoice_id: invoice.id,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_invoice_id', invoice.id)
    
    if (error) {
      console.error('Error updating invoice payment:', error)
    } else {
      console.log('Invoice payment succeeded:', invoice.id)
      
      // Send payment confirmation email
      try {
        // Get client details for email
        const { data: clientData } = await supabase
          .from('client_subscription_summary_view')
          .select('client_name, client_email, law_firm_name')
          .eq('stripe_invoice_id', invoice.id)
          .single()
        
        if (clientData) {
          await emailNotificationService.sendPaymentConfirmation({
            client_name: clientData.client_name,
            client_email: clientData.client_email,
            amount: stripeService.formatAmount(invoice.amount_paid),
            payment_date: new Date().toISOString(),
            law_firm_name: clientData.law_firm_name,
            invoice_number: invoice.number,
            payment_method: 'Cartão/PIX'
          })
        }
      } catch (emailError) {
        console.error('Error sending payment confirmation email:', emailError)
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

async function handleInvoicePaymentFailed(event: any) {
  const invoice = event.data.object
  const supabase = createClient()
  
  try {
    // Update invoice status
    const { error } = await supabase
      .from('subscription_invoices')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_invoice_id', invoice.id)
    
    if (error) {
      console.error('Error updating failed invoice:', error)
    } else {
      console.log('Invoice payment failed:', invoice.id)
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}

async function handlePaymentIntentSucceeded(event: any) {
  const paymentIntent = event.data.object
  const supabase = createClient()
  
  try {
    const paymentType = paymentIntent.metadata.type
    
    if (paymentType === 'case_payment') {
      // Update case invoice
      const { error } = await supabase
        .from('case_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentIntent.metadata.invoice_id)
      
      if (error) {
        console.error('Error updating case payment:', error)
      } else {
        console.log('Case payment succeeded:', paymentIntent.id)
      }
    } else if (paymentType === 'installment_payment') {
      // Update payment plan invoice
      const { error } = await supabase
        .from('payment_plan_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          stripe_payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString()
        })
        .eq('payment_plan_id', paymentIntent.metadata.payment_plan_id)
        .eq('installment_number', parseInt(paymentIntent.metadata.installment_number))
      
      if (error) {
        console.error('Error updating installment payment:', error)
      } else {
        console.log('Installment payment succeeded:', paymentIntent.id)
      }
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

async function handlePaymentIntentFailed(event: any) {
  const paymentIntent = event.data.object
  const supabase = createClient()
  
  try {
    const paymentType = paymentIntent.metadata.type
    
    if (paymentType === 'case_payment') {
      // Update case invoice
      const { error } = await supabase
        .from('case_invoices')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentIntent.metadata.invoice_id)
      
      if (error) {
        console.error('Error updating failed case payment:', error)
      }
    } else if (paymentType === 'installment_payment') {
      // Update payment plan invoice
      const { error } = await supabase
        .from('payment_plan_invoices')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('payment_plan_id', paymentIntent.metadata.payment_plan_id)
        .eq('installment_number', parseInt(paymentIntent.metadata.installment_number))
      
      if (error) {
        console.error('Error updating failed installment payment:', error)
      }
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}