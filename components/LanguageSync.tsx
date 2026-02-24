"use client"

import { useEffect } from 'react'
import { useLanguageStore } from '@/lib/i18n'

/**
 * Syncs the Zustand locale to document.documentElement.lang
 * so the HTML lang attribute stays reactive.
 */
export function LanguageSync() {
  const locale = useLanguageStore((s) => s.locale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
