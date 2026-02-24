import { useLanguageStore } from './store'
import type { Locale, Namespace, TranslationRecord } from './types'

// Static imports — all JSON files bundled at build time (<15KB total)
import idCommon from './locales/id/common.json'
import idAuth from './locales/id/auth.json'
import idOnboarding from './locales/id/onboarding.json'
import idBaseline from './locales/id/baseline.json'
import idPlan from './locales/id/plan.json'
import idLockedIn from './locales/id/lockedIn.json'
import idTaktis from './locales/id/taktis.json'
import idAnalytics from './locales/id/analytics.json'
import idRecycle from './locales/id/recycle.json'
import idSettings from './locales/id/settings.json'

import enCommon from './locales/en/common.json'
import enAuth from './locales/en/auth.json'
import enOnboarding from './locales/en/onboarding.json'
import enBaseline from './locales/en/baseline.json'
import enPlan from './locales/en/plan.json'
import enLockedIn from './locales/en/lockedIn.json'
import enTaktis from './locales/en/taktis.json'
import enAnalytics from './locales/en/analytics.json'
import enRecycle from './locales/en/recycle.json'
import enSettings from './locales/en/settings.json'

const translations: Record<Locale, Record<Namespace, TranslationRecord>> = {
  id: {
    common: idCommon,
    auth: idAuth,
    onboarding: idOnboarding,
    baseline: idBaseline,
    plan: idPlan,
    lockedIn: idLockedIn,
    taktis: idTaktis,
    analytics: idAnalytics,
    recycle: idRecycle,
    settings: idSettings,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    onboarding: enOnboarding,
    baseline: enBaseline,
    plan: enPlan,
    lockedIn: enLockedIn,
    taktis: enTaktis,
    analytics: enAnalytics,
    recycle: enRecycle,
    settings: enSettings,
  },
}

/**
 * Resolve a dot-notation key from a nested translation object.
 * e.g. "nav.plan" → translations.nav.plan
 */
function resolve(obj: TranslationRecord, key: string): string | undefined {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

/**
 * Interpolate {{param}} placeholders in a string.
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = params[key]
    return val != null ? String(val) : `{{${key}}}`
  })
}

/**
 * Create a `t` function for a given locale and namespace.
 * Fallback chain: current locale → Indonesian → raw key.
 */
function createT(locale: Locale, namespace: Namespace) {
  return function t(key: string, params?: Record<string, string | number>): string {
    // Try current locale
    const value = resolve(translations[locale][namespace], key)
    if (value) return interpolate(value, params)

    // Fallback to Indonesian (primary language)
    if (locale !== 'id') {
      const fallback = resolve(translations.id[namespace], key)
      if (fallback) return interpolate(fallback, params)
    }

    // Last resort: return raw key
    return key
  }
}

/**
 * Hook: useTranslation(namespace)
 * Returns { t, locale } for translating strings in the given namespace.
 */
export function useTranslation(namespace: Namespace) {
  const locale = useLanguageStore((s) => s.locale)
  const t = createT(locale, namespace)
  return { t, locale }
}

// Re-export for convenience
export { useLanguageStore } from './store'
export type { Locale, Namespace } from './types'
