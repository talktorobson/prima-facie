'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentPlanService } from '@/lib/billing/payment-plan-service'
import type { PaymentPlanFormData } from '@/lib/billing/payment-plan-types'

export function usePaymentPlans(lawFirmId: string | null | undefined) {
  return useQuery({
    queryKey: ['payment-plans', lawFirmId],
    queryFn: () => paymentPlanService.getPaymentPlans(lawFirmId!),
    enabled: !!lawFirmId,
  })
}

export function useCreatePaymentPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ lawFirmId, matterId, formData }: { lawFirmId: string; matterId: string; formData: PaymentPlanFormData }) =>
      paymentPlanService.createPaymentPlan(lawFirmId, matterId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}

export function useUpdatePaymentPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ planId, formData }: { planId: string; formData: PaymentPlanFormData }) =>
      paymentPlanService.updatePaymentPlan(planId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}

export function useActivatePaymentPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planId: string) => paymentPlanService.activatePaymentPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}

export function useCancelPaymentPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planId: string) => paymentPlanService.cancelPaymentPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}
