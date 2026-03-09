import { FeatureGatedError } from '@prisma-flow/shared'
import { logger } from '../logger.js'

export type Tier = 'free' | 'pro' | 'enterprise'

export interface FeatureMatrix {
  riskAnalysis: boolean
  webhookAlerts: boolean
  auditLog: boolean
  ciAnnotations: boolean
  envComparison: boolean
  rollbackGen: boolean
  simulation: boolean
  gitAwareness: boolean
  multiProject: boolean
  rbac: boolean
  ssoHooks: boolean
  prioritySupport: boolean
}

const TIER_FEATURES: Record<Tier, FeatureMatrix> = {
  free: {
    riskAnalysis: false,
    webhookAlerts: false,
    auditLog: false,
    ciAnnotations: false,
    envComparison: false,
    rollbackGen: false,
    simulation: false,
    gitAwareness: false,
    multiProject: false,
    rbac: false,
    ssoHooks: false,
    prioritySupport: false,
  },
  pro: {
    riskAnalysis: true,
    webhookAlerts: true,
    auditLog: true,
    ciAnnotations: true,
    envComparison: true,
    rollbackGen: true,
    simulation: true,
    gitAwareness: true,
    multiProject: false,
    rbac: false,
    ssoHooks: false,
    prioritySupport: false,
  },
  enterprise: {
    riskAnalysis: true,
    webhookAlerts: true,
    auditLog: true,
    ciAnnotations: true,
    envComparison: true,
    rollbackGen: true,
    simulation: true,
    gitAwareness: true,
    multiProject: true,
    rbac: true,
    ssoHooks: true,
    prioritySupport: true,
  },
}

let _resolvedTier: Tier | null = null

export function resolveTier(): Tier {
  if (_resolvedTier) return _resolvedTier

  const key = process.env.PRISMAFLOW_LICENCE_KEY ?? ''

  if (!key) {
    _resolvedTier = 'free'
    return 'free'
  }

  // Key format: pf_live_<tier>_<token> or pf_test_<tier>_<token>
  if (key.startsWith('pf_live_ent_') || key.startsWith('pf_test_ent_')) {
    _resolvedTier = 'enterprise'
  } else if (key.startsWith('pf_live_pro_') || key.startsWith('pf_test_pro_')) {
    _resolvedTier = 'pro'
  } else {
    logger.warn('PRISMAFLOW_LICENCE_KEY format unrecognised — defaulting to free tier')
    _resolvedTier = 'free'
  }

  return _resolvedTier
}

export function getFeatures(): FeatureMatrix {
  return TIER_FEATURES[resolveTier()]
}

export function isFeatureEnabled(feature: keyof FeatureMatrix): boolean {
  return getFeatures()[feature]
}

/** Throws a FeatureGatedError if the feature isn't available on the current plan. */
export function requireFeature(feature: keyof FeatureMatrix): void {
  if (!isFeatureEnabled(feature)) {
    const tier = resolveTier()
    const requiredTier = ['multiProject', 'rbac', 'ssoHooks', 'prioritySupport'].includes(feature)
      ? 'Enterprise'
      : 'Pro'
    throw new FeatureGatedError(feature, requiredTier)
  }
}

// Reset for testing
export function _resetTierCache(): void {
  _resolvedTier = null
}
