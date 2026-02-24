export type Locale = 'id' | 'en'

export type Namespace =
  | 'common'
  | 'auth'
  | 'onboarding'
  | 'baseline'
  | 'plan'
  | 'lockedIn'
  | 'taktis'
  | 'analytics'
  | 'recycle'
  | 'settings'

export interface TranslationRecord {
  [key: string]: string | TranslationRecord
}
