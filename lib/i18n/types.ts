export type Locale = 'id' | 'en'

export type Namespace =
  | 'common'
  | 'auth'
  | 'onboarding'
  | 'baseline'
  | 'plan'
  | 'drill'
  | 'review'
  | 'analytics'
  | 'recycle'
  | 'settings'

export interface TranslationRecord {
  [key: string]: string | TranslationRecord
}
