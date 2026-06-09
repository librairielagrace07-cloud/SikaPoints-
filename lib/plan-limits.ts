export type Plan = 'starter' | 'solo' | 'croissance' | 'business'

export interface PlanLimits {
  maxPoints: number
  maxAgents: number
  maxTransactionsParMois: number  // 0 = illimité
  histoireJours: number           // 0 = illimité
  exportsPDF: boolean
  exportsExcel: boolean
  comptabilite: boolean
  alertesUV: boolean
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  starter: {
    maxPoints: 1,
    maxAgents: 1,
    maxTransactionsParMois: 50,
    histoireJours: 7,
    exportsPDF: false,
    exportsExcel: false,
    comptabilite: false,
    alertesUV: false,
  },
  solo: {
    maxPoints: 1,
    maxAgents: 3,
    maxTransactionsParMois: 0,
    histoireJours: 0,
    exportsPDF: true,
    exportsExcel: true,
    comptabilite: false,
    alertesUV: true,
  },
  croissance: {
    maxPoints: 3,
    maxAgents: 10,
    maxTransactionsParMois: 0,
    histoireJours: 0,
    exportsPDF: true,
    exportsExcel: true,
    comptabilite: true,
    alertesUV: true,
  },
  business: {
    maxPoints: 999,
    maxAgents: 999,
    maxTransactionsParMois: 0,
    histoireJours: 0,
    exportsPDF: true,
    exportsExcel: true,
    comptabilite: true,
    alertesUV: true,
  },
}

export const PLAN_LABELS: Record<Plan, string> = {
  starter:    'Starter',
  solo:       'Solo',
  croissance: 'Croissance',
  business:   'Business',
}

export function getLimits(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[(plan as Plan)] ?? PLAN_LIMITS.starter
}

export function getPlanLabel(plan: string | null | undefined): string {
  return PLAN_LABELS[(plan as Plan)] ?? 'Starter'
}
