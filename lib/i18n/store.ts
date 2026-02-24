import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Locale } from './types'

interface LanguageStore {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      locale: 'id',
      setLocale: (locale) => set({ locale }),
    }),
    {
      name: 'gaspol-language',
    }
  )
)
