'use client'

// =====================================================
// PAYMENT FORM COMPONENT
// Stripe payment processing for case billing
// =====================================================

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormData {
  amount: number
  description: string
  customer_email: string
  customer_name: string
  case_id?: string
  invoice_id?: string
  payment_plan_id?: string
  installment_number?: number
  total_installments?: number
  law_firm_id: string
  client_id: string
  payment_type: 'case_payment' | 'installment_payment'
}

interface PaymentFormProps {
  paymentData: PaymentFormData
  onPaymentSuccess: (paymentIntentId: string) => void
  onPaymentError: (error: string) => void
}

function CheckoutForm({ paymentData, onPaymentSuccess, onPaymentError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create payment intent
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const { client_secret, payment_intent_id } = await response.json()

      if (!client_secret) {
        throw new Error('Failed to create payment intent')
      }

      // Confirm payment
      const cardElement = elements.getElement(CardElement)
      
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: paymentData.customer_name,
              email: paymentData.customer_email,
            },
          },
        }
      )

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        onPaymentError(stripeError.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      onPaymentError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Pagamento</CardTitle>
        <CardDescription>
          {paymentData.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Amount */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {formatAmount(paymentData.amount)}
            </div>
            {paymentData.payment_type === 'installment_payment' && (
              <div className="text-sm text-blue-700">
                Parcela {paymentData.installment_number} de {paymentData.total_installments}
              </div>
            )}
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="space-y-2">
            <Label htmlFor="customer_name">Nome do Cliente</Label>
            <Input
              id="customer_name"
              value={paymentData.customer_name}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_email">Email</Label>
            <Input
              id="customer_email"
              value={paymentData.customer_email}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <Separator />

          {/* Card Information */}
          <div className="space-y-2">
            <Label>Informações do Cartão</Label>
            <div className="p-3 border rounded-md">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="text-xs text-gray-600">
            <div>💳 Cartão de Crédito/Débito</div>
            <div>🏦 PIX (disponível após confirmação)</div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              `Pagar ${formatAmount(paymentData.amount)}`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}