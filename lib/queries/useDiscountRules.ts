'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { discountService } from '@/lib/billing/discount-service'
import type { DiscountRuleFormData } from '@/lib/billing/discount-types'

export function useDiscountRules(lawFirmId: string | null | undefined) {
  return useQuery({
    queryKey: ['discount-rules', lawFirmId],
    queryFn: () => discountService.getDiscountRules(lawFirmId!),
    enabled: !!lawFirmId,
  })
}

export function useCreateDiscountRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ lawFirmId, formData }: { lawFirmId: string; formData: DiscountRuleFormData }) =>
      discountService.createDiscountRule(lawFirmId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] })
    },
  })
}

export function useUpdateDiscountRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ruleId, formData }: { ruleId: string; formData: DiscountRuleFormData }) =>
      discountService.updateDiscountRule(ruleId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] })
    },
  })
}

export function useToggleDiscountRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => discountService.toggleDiscountRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] })
    },
  })
}

export function useDeleteDiscountRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ruleId: string) => discountService.deleteDiscountRule(ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] })
    },
  })
}

export function useCreatePresetRules() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (lawFirmId: string) => discountService.createPresetRules(lawFirmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount-rules'] })
    },
  })
}
