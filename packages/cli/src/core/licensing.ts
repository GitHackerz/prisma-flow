/**
 * Feature gating / licensing.
 *
 * Tiers:
 *   free       – core dashboard, status, basic drift detection
 *   pro        – risk analysis, webhook notifications, audit log, CI annotations
 *   enterprise – RBAC, SSO hooks, multi-project, advanced audit, priority support
 *
 * Licence key format: pf_live_<base64> or pf_test_<base64>
 *
 * For the local (OSS) version, licence validation is done by checking the
 * PRISMAFLOW_LICENCE_KEY environment variable.  In a future SaaS release this
 * will be verified against a cloud licence server.
 */
import { logger } from '../logger.js'

export type Tier = 'free' | 'pro' | 'enterprise'

export interface FeatureMatrix {
  riskAnalysis: boolean
  webhookAlerts: boolean
  auditLog: boolean
  ciAnnotations: boolean
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

/** Throws a typed error if the feature isn't available on the current plan. */
export function requireFeature(feature: keyof FeatureMatrix): void {
  if (!isFeatureEnabled(feature)) {
    const tier = resolveTier()
    throw new Error(
      `Feature "${feature}" is not available on the ${tier} plan. Upgrade at https://prismaflow.dev/pricing`,
    )
  }
}

// Reset for testing
export function _resetTierCache(): void {
  _resolvedTier = null
}
